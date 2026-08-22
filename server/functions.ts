import type { Response } from "express";
import type { AuthenticatedRequest } from "./auth.js";
import { userIsAdmin } from "./auth.js";
import { exportAllTables, importAllTables } from "./data.js";
import { prisma, toRecordData } from "./db.js";
import { fetchGoogleAnalytics, gaConfigured } from "./integrations/googleAnalytics.js";
import { importCityPrices, priceProviderConfigured } from "./integrations/priceProvider.js";

const tableRows = async (tableName: string) =>
  (await prisma.contentRecord.findMany({ where: { tableName } })).map(({ data }) => toRecordData(data));

const partyPlanner = async (body: Record<string, unknown>) => {
  const guests = Math.max(2, Number(body.guests) || 10);
  const budget = Math.max(500, Number(body.budget) || 5000);
  const requested = Array.isArray(body.categories) ? body.categories.map(String) : [];
  const categories = await tableRows("categories");
  const products = await tableRows("products");
  const prices = await tableRows("product_prices");
  const selected = requested.length
    ? categories.filter((category) => requested.includes(String(category.name)))
    : categories.slice(0, 4);
  const activeCategories = selected.length ? selected : categories.slice(0, 4);
  const perCategoryBudget = budget / Math.max(activeCategories.length, 1);

  const recommendations = activeCategories.map((category) => {
    const categoryProducts = products.filter((product) => product.category_id === category.id);
    const suggestions = categoryProducts.slice(0, 3).map((product) => `${product.brand ?? ""} ${product.name ?? ""}`.trim());
    const availablePrices = categoryProducts
      .map((product) => prices.find((price) => price.product_id === product.id)?.price)
      .map(Number)
      .filter((price) => Number.isFinite(price) && price > 0);
    const unitPrice = Math.max(500, availablePrices[0] ?? Math.max(700, perCategoryBudget / 2));
    const servingQuantity = Math.max(1, Math.ceil(guests / 4));
    const affordableQuantity = Math.max(1, Math.floor(perCategoryBudget / unitPrice));
    const quantity = Math.min(servingQuantity, affordableQuantity);
    return {
      category: String(category.name ?? "Drinks"),
      quantity,
      estimatedCost: Math.round(Math.min(perCategoryBudget, quantity * unitPrice)),
      suggestions: suggestions.length ? suggestions : ["Choose a highly rated option from this category"],
      reasoning: `Balanced for ${guests} guests while keeping this category within its share of the budget.`,
    };
  });
  const totalEstimatedCost = recommendations.reduce((sum, item) => sum + item.estimatedCost, 0);
  return {
    recommendations,
    totalEstimatedCost,
    partyTips: [
      "Plan two to three servings per guest for a three-hour gathering.",
      "Keep water, ice and non-alcoholic options readily available.",
      "Serve responsibly and arrange safe transport for guests.",
    ],
    budgetAnalysis: `The plan uses approximately ₹${totalEstimatedCost.toLocaleString("en-IN")} of the ₹${budget.toLocaleString("en-IN")} budget.`,
    mode: process.env.AI_API_KEY ? "local-fallback-ai-key-present" : "deterministic-local",
  };
};

const localRecommendation = async (body: Record<string, unknown>) => {
  const prompt = String(body.prompt ?? "").trim();
  if (!prompt) throw new Error("Prompt is required");
  const products = (await tableRows("products")).slice(0, 5);
  const suggestions = products.map((product) => `${product.brand ?? ""} ${product.name ?? ""}`.trim()).filter(Boolean);
  return {
    success: true,
    provider: "bevory-local",
    model: "catalog-rules-v1",
    content: suggestions.length
      ? `Based on the current Bevory catalog, consider ${suggestions.join(", ")}. Match the final choice to your budget, location and serving occasion.`
      : "No matching catalog products are available yet. Add products and prices in the admin dashboard, then retry.",
  };
};

export const functionsHandler = async (req: AuthenticatedRequest, res: Response) => {
  const name = req.params.name;
  const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
  try {
    if (name === "party-planner-ai") return res.json(await partyPlanner(body));
    if (name === "ai-recommend") return res.json(await localRecommendation(body));

    if (name === "export-database") {
      if (!req.authUser || !await userIsAdmin(req.authUser.id)) {
        return res.status(403).json({ error: "Administrator access required" });
      }
      if (body.action === "import") {
        const data = body.data && typeof body.data === "object"
          ? body.data as Record<string, Array<Record<string, unknown>>>
          : {};
        return res.json({ success: true, results: await importAllTables(data) });
      }
      const data = await exportAllTables();
      const summary = Object.fromEntries(Object.entries(data).map(([table, rows]) => [table, rows.length]));
      return res.json({ success: true, exported_at: new Date().toISOString(), data, summary });
    }

    if (name === "google-analytics") {
      if (!req.authUser || !await userIsAdmin(req.authUser.id)) {
        return res.status(403).json({ error: "Administrator access required" });
      }
      if (body.action === "status") return res.json({ configured: gaConfigured() });
      if (!gaConfigured()) return res.status(503).json({ error: "Google Analytics credentials are not configured" });
      return res.json(await fetchGoogleAnalytics(
        String(body.propertyId ?? ""),
        String(body.startDate ?? "30daysAgo"),
        String(body.endDate ?? "today"),
      ));
    }

    if (name === "scrape-prices") {
      if (!req.authUser || !await userIsAdmin(req.authUser.id)) {
        return res.status(403).json({ success: false, error: "Administrator access required" });
      }
      if (!priceProviderConfigured()) {
        return res.status(503).json({ success: false, error: "PRICE_PROVIDER_URL is not configured" });
      }
      return res.json(await importCityPrices(String(body.city_id ?? ""), String(body.city_name ?? "")));
    }

    return res.status(404).json({ error: `Unknown function: ${name}` });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Function failed" });
  }
};
