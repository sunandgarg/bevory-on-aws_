import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { PrismaClient, type Prisma } from "@prisma/client";
import { BEVORY_CITIES } from "../src/lib/locations.js";

type SitemapEntry = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
  lastmod?: string;
};

const origin = "https://bevory.in";
const today = new Date().toISOString().slice(0, 10);
const prisma = new PrismaClient();

const jsonObject = (value: Prisma.JsonValue): Prisma.JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Prisma.JsonObject : {};

const xmlEscape = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const staticPages: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/categories", changefreq: "weekly", priority: "0.9" },
  { path: "/party-planner", changefreq: "weekly", priority: "0.8" },
  { path: "/cocktails", changefreq: "weekly", priority: "0.7" },
  { path: "/guide", changefreq: "weekly", priority: "0.7" },
  { path: "/brands", changefreq: "weekly", priority: "0.7" },
  { path: "/help", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/disclaimer", changefreq: "yearly", priority: "0.3" },
];

try {
  const records = await prisma.contentRecord.findMany({
    where: { tableName: { in: ["blog_posts", "brand_spotlights", "categories", "cities", "product_prices", "products"] } },
  });
  const rows = records.map((record) => ({
    table: record.tableName,
    id: record.recordId,
    data: jsonObject(record.data),
  }));
  const prices = rows.filter((row) => (
    row.table === "product_prices"
    && row.data.price_available !== false
    && row.data.requires_review !== true
  ));
  const pricedProductIds = new Set(prices.map((row) => String(row.data.product_id ?? "")).filter(Boolean));
  const pricedCityIds = new Set(prices.map((row) => String(row.data.city_id ?? "")).filter(Boolean));

  const categoryPages: SitemapEntry[] = rows
    .filter((row) => row.table === "categories" && row.data.is_active !== false && row.data.slug)
    .map((row) => ({
      path: `/category/${row.data.slug}`,
      changefreq: "weekly",
      priority: "0.8",
      lastmod: String(row.data.updated_at ?? today).slice(0, 10),
    }));

  const cityPages: SitemapEntry[] = rows
    .filter((row) => row.table === "cities" && pricedCityIds.has(row.id))
    .map((row) => BEVORY_CITIES.find((city) => city.name.toLowerCase() === String(row.data.name ?? "").toLowerCase()))
    .filter((city): city is (typeof BEVORY_CITIES)[number] => Boolean(city))
    .map((city) => ({ path: `/${city.slug}`, changefreq: "daily", priority: "0.9" }));

  const brandPages: SitemapEntry[] = rows
    .filter((row) => row.table === "brand_spotlights" && row.data.is_active !== false && row.data.slug)
    .map((row) => ({
      path: `/brand/${row.data.slug}`,
      changefreq: "weekly",
      priority: "0.6",
      lastmod: String(row.data.updated_at ?? today).slice(0, 10),
    }));

  const productPages: SitemapEntry[] = rows
    .filter((row) => row.table === "products" && row.data.is_active !== false && row.data.slug && pricedProductIds.has(row.id))
    .map((row) => ({
      path: `/product/${row.data.slug}`,
      changefreq: "weekly",
      priority: "0.7",
      lastmod: String(row.data.updated_at ?? today).slice(0, 10),
    }));

  const guidePages: SitemapEntry[] = rows
    .filter((row) => row.table === "blog_posts" && row.data.is_published === true && row.data.slug)
    .map((row) => ({
      path: `/guide/${row.data.slug}`,
      changefreq: "monthly",
      priority: "0.6",
      lastmod: String(row.data.updated_at ?? row.data.published_at ?? today).slice(0, 10),
    }));

  const entries = [...staticPages, ...cityPages, ...categoryPages, ...brandPages, ...productPages, ...guidePages];
  const uniqueEntries = [...new Map(entries.map((entry) => [entry.path, entry])).values()];
  const urls = uniqueEntries.map(({ path, changefreq, priority, lastmod = today }) => `  <url>
    <loc>${xmlEscape(`${origin}${path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join("\n");

  await writeFile(
    new URL("../public/sitemap.xml", import.meta.url),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );

  console.log(`Generated sitemap with ${uniqueEntries.length} URLs (${productPages.length} products, ${brandPages.length} brands, ${guidePages.length} guides)`);
} finally {
  await prisma.$disconnect();
}
