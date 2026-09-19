import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { prisma, toRecordData } from "./db.js";

type CatalogRow = Record<string, unknown>;

type CatalogVariant = {
  volume: string;
  volume_ml: number | null;
  price: number;
  mrp: number | null;
};

type CachedCatalog = {
  expiresAt: number;
  payload: ReturnType<typeof buildCityCatalog>;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const cityCatalogCache = new Map<string, CachedCatalog>();

const jsonRows = (records: Array<{ data: Prisma.JsonValue }>) =>
  records.map(({ data }) => toRecordData(data));

const isActive = (row: CatalogRow) => row.is_active !== false;

const preferredVariant = (left: CatalogVariant, right: CatalogVariant) => {
  const leftPreferred = left.volume_ml === 750 ? 1 : 0;
  const rightPreferred = right.volume_ml === 750 ? 1 : 0;
  return rightPreferred - leftPreferred || (right.volume_ml ?? 0) - (left.volume_ml ?? 0);
};

export const buildCityCatalog = (
  prices: CatalogRow[],
  products: CatalogRow[],
  categories: CatalogRow[],
  subcategories: CatalogRow[],
) => {
  const variantsByProduct = new Map<string, CatalogVariant[]>();
  for (const row of prices) {
    if (row.price_available === false || row.requires_review === true) continue;
    const productId = String(row.product_id ?? "");
    const price = Number(row.price);
    if (!productId || !Number.isFinite(price) || price <= 0) continue;
    const variants = variantsByProduct.get(productId) ?? [];
    variants.push({
      volume: String(row.volume || `${row.volume_ml || ""}ml`),
      volume_ml: row.volume_ml == null ? null : Number(row.volume_ml),
      price,
      mrp: row.mrp == null ? null : Number(row.mrp),
    });
    variantsByProduct.set(productId, variants);
  }

  const categoryById = new Map(categories.filter(isActive).map((row) => [String(row.id), row]));
  const subcategoryById = new Map(subcategories.filter(isActive).map((row) => [String(row.id), row]));
  const availableProducts: CatalogRow[] = products
    .filter((row) => isActive(row) && variantsByProduct.has(String(row.id)))
    .map<CatalogRow>((row) => {
      const variants = (variantsByProduct.get(String(row.id)) ?? []).sort(preferredVariant);
      const preferred = variants[0];
      const category = categoryById.get(String(row.category_id ?? ""));
      const subcategory = subcategoryById.get(String(row.sub_category_id ?? ""));
      return {
        ...row,
        price: preferred?.price ?? null,
        mrp: preferred?.mrp ?? null,
        volume: preferred?.volume ?? row.volume ?? null,
        available_variants: variants,
        category: category ? {
          name: category.name,
          slug: category.slug,
          emoji: category.emoji ?? null,
        } : null,
        sub_category: subcategory ? {
          name: subcategory.name,
          slug: subcategory.slug ?? null,
          emoji: subcategory.emoji ?? null,
        } : null,
      };
    })
    .sort((left, right) => (
      String(left.brand ?? "").localeCompare(String(right.brand ?? ""))
      || String(left.name ?? "").localeCompare(String(right.name ?? ""))
    ));

  const activeCategories = categories
    .filter(isActive)
    .sort((left, right) => Number(left.order_index ?? 0) - Number(right.order_index ?? 0))
    .map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      emoji: row.emoji ?? null,
      image_url: row.image_url ?? null,
      description: row.description ?? null,
    }));

  return {
    categories: activeCategories,
    products: availableProducts,
    totalProducts: availableProducts.length,
  };
};

export const invalidateCatalogCache = () => cityCatalogCache.clear();

export const cityCatalogHandler = async (req: Request, res: Response) => {
  const cityId = String(req.params.cityId ?? "").trim();
  if (!cityId || cityId.length > 191 || !/^[a-zA-Z0-9_-]+$/.test(cityId)) {
    return res.status(400).json({ data: null, error: { message: "A valid city is required" } });
  }

  const cached = cityCatalogCache.get(cityId);
  if (cached && cached.expiresAt > Date.now()) {
    res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    return res.json({ data: cached.payload, error: null });
  }

  try {
    const priceRecords = await prisma.contentRecord.findMany({
      where: {
        tableName: "product_prices",
        AND: [
          { data: { path: "$.city_id", equals: cityId } },
          { data: { path: "$.price_available", equals: true } },
          { NOT: { data: { path: "$.requires_review", equals: true } } },
        ],
      },
      select: { data: true },
    });
    const prices = jsonRows(priceRecords);
    const productIds = [...new Set(prices.map((row) => String(row.product_id ?? "")).filter(Boolean))];

    const [productRecords, categoryRecords, subcategoryRecords] = await Promise.all([
      productIds.length
        ? prisma.contentRecord.findMany({
            where: { tableName: "products", recordId: { in: productIds } },
            select: { data: true },
          })
        : Promise.resolve([]),
      prisma.contentRecord.findMany({ where: { tableName: "categories" }, select: { data: true } }),
      prisma.contentRecord.findMany({ where: { tableName: "sub_categories" }, select: { data: true } }),
    ]);

    const payload = buildCityCatalog(
      prices,
      jsonRows(productRecords),
      jsonRows(categoryRecords),
      jsonRows(subcategoryRecords),
    );
    cityCatalogCache.set(cityId, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
    res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    return res.json({ data: payload, error: null });
  } catch (error) {
    return res.status(500).json({
      data: null,
      error: { message: error instanceof Error ? error.message : "Catalogue unavailable" },
    });
  }
};
