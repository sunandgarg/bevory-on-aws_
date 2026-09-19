import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { PrismaClient, type Prisma } from "@prisma/client";
import { BEVORY_CITIES } from "../src/lib/locations.js";

type SitemapEntry = {
  path: string;
  lastmod?: string;
  images?: string[];
};

type DataRow = {
  table: string;
  id: string;
  data: Prisma.JsonObject;
};

const origin = "https://bevory.in";
const prisma = new PrismaClient();
const tableNames = [
  "blog_posts",
  "brand_spotlights",
  "categories",
  "cities",
  "product_prices",
  "products",
  "sub_categories",
] as const;

const jsonObject = (value: Prisma.JsonValue): Prisma.JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Prisma.JsonObject : {};

const xmlEscape = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const validImageUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
};

const latestTimestamp = (...values: unknown[]) => {
  const dates = values
    .flat()
    .map((value) => new Date(String(value ?? "")))
    .filter((date) => !Number.isNaN(date.getTime()));
  return dates.length
    ? new Date(Math.max(...dates.map((date) => date.getTime()))).toISOString()
    : undefined;
};

const staticPages: SitemapEntry[] = [
  { path: "/" },
  { path: "/categories" },
  { path: "/party-planner" },
  { path: "/cocktails" },
  { path: "/guide" },
  { path: "/brands" },
  { path: "/help" },
  { path: "/contact" },
  { path: "/privacy-policy" },
  { path: "/terms" },
  { path: "/disclaimer" },
];

const groupBy = (rows: DataRow[], key: (row: DataRow) => string) => {
  const grouped = new Map<string, DataRow[]>();
  for (const row of rows) {
    const value = key(row);
    if (!value) continue;
    const group = grouped.get(value) ?? [];
    group.push(row);
    grouped.set(value, group);
  }
  return grouped;
};

const loadRows = async (): Promise<DataRow[]> => {
  try {
    const records = await prisma.contentRecord.findMany({
      where: { tableName: { in: [...tableNames] } },
    });
    return records.map((record) => ({
      table: record.tableName,
      id: record.recordId,
      data: jsonObject(record.data),
    }));
  } catch (error) {
    const apiUrl = process.env.SITEMAP_API_URL || `${origin}/api/query`;
    console.warn(
      `Database unavailable; generating from ${apiUrl} `
      + `(${error instanceof Error ? error.message.split("\n")[0] : "connection failed"})`,
    );
    const tables = await Promise.all(tableNames.map(async (table) => {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ table, operation: "select" }),
      });
      if (!response.ok) throw new Error(`Failed to fetch ${table}: HTTP ${response.status}`);
      const body = await response.json() as { data?: Array<Record<string, unknown>> };
      if (!Array.isArray(body.data)) throw new Error(`Invalid ${table} response`);
      return body.data.map((data) => ({
        table,
        id: String(data.id ?? ""),
        data: data as Prisma.JsonObject,
      }));
    }));
    return tables.flat();
  }
};

try {
  const rows = await loadRows();
  const prices = rows.filter((row) => (
    row.table === "product_prices"
    && row.data.price_available !== false
    && row.data.requires_review !== true
    && Number(row.data.price) > 0
  ));
  const pricesByProduct = groupBy(prices, (row) => String(row.data.product_id ?? ""));
  const pricesByCity = groupBy(prices, (row) => String(row.data.city_id ?? ""));
  const pricedProductIds = new Set(pricesByProduct.keys());
  const activeCategories = rows.filter((row) => (
    row.table === "categories" && row.data.is_active !== false && row.data.slug
  ));
  const categoryById = new Map(activeCategories.map((row) => [row.id, row]));
  const activeProducts = rows.filter((row) => (
    row.table === "products"
    && row.data.is_active !== false
    && row.data.slug
    && pricedProductIds.has(row.id)
  ));
  const productsBySubcategory = groupBy(activeProducts, (row) => String(row.data.sub_category_id ?? ""));

  const categoryPages: SitemapEntry[] = activeCategories.map((row) => ({
    path: `/category/${row.data.slug}`,
    lastmod: latestTimestamp(row.data.updated_at, row.data.created_at),
    images: [validImageUrl(row.data.image_url)].filter((value): value is string => Boolean(value)),
  }));

  const subcategoryPages: SitemapEntry[] = rows
    .filter((row) => (
      row.table === "sub_categories"
      && row.data.is_active !== false
      && row.data.slug
      && productsBySubcategory.has(row.id)
      && categoryById.has(String(row.data.category_id ?? ""))
    ))
    .map((row) => {
      const category = categoryById.get(String(row.data.category_id))!;
      const productUpdates = (productsBySubcategory.get(row.id) ?? []).map((product) => product.data.updated_at);
      return {
        path: `/category/${category.data.slug}/${row.data.slug}`,
        lastmod: latestTimestamp(row.data.updated_at, row.data.created_at, productUpdates),
        images: [validImageUrl(row.data.image_url)].filter((value): value is string => Boolean(value)),
      };
    });

  const cityPages: SitemapEntry[] = rows
    .filter((row) => row.table === "cities" && pricesByCity.has(row.id))
    .map((row) => ({
      row,
      city: BEVORY_CITIES.find((city) => (
        city.name.toLowerCase() === String(row.data.name ?? "").toLowerCase()
      )),
    }))
    .filter((item): item is { row: DataRow; city: (typeof BEVORY_CITIES)[number] } => Boolean(item.city))
    .map(({ row, city }) => ({
      path: `/${city.slug}`,
      lastmod: latestTimestamp(
        row.data.updated_at,
        ...(pricesByCity.get(row.id) ?? []).map((price) => price.data.updated_at),
      ),
    }));

  const brandPages: SitemapEntry[] = rows
    .filter((row) => row.table === "brand_spotlights" && row.data.is_active !== false && row.data.slug)
    .map((row) => ({
      path: `/brand/${row.data.slug}`,
      lastmod: latestTimestamp(row.data.updated_at, row.data.created_at),
      images: [row.data.image_url, row.data.logo_url]
        .map(validImageUrl)
        .filter((value): value is string => Boolean(value)),
    }));

  const productPages: SitemapEntry[] = activeProducts.map((row) => ({
    path: `/product/${row.data.slug}`,
    lastmod: latestTimestamp(
      row.data.updated_at,
      row.data.created_at,
      ...(pricesByProduct.get(row.id) ?? []).map((price) => price.data.updated_at),
    ),
    images: row.data.image_identity_verified === true
      ? [validImageUrl(row.data.image_url)].filter((value): value is string => Boolean(value))
      : [],
  }));

  const guidePages: SitemapEntry[] = rows
    .filter((row) => row.table === "blog_posts" && row.data.is_published === true && row.data.slug)
    .map((row) => ({
      path: `/guide/${row.data.slug}`,
      lastmod: latestTimestamp(row.data.updated_at, row.data.published_at, row.data.created_at),
      images: [validImageUrl(row.data.cover_image_url)].filter((value): value is string => Boolean(value)),
    }));

  const entries = [
    ...staticPages,
    ...cityPages,
    ...categoryPages,
    ...subcategoryPages,
    ...brandPages,
    ...productPages,
    ...guidePages,
  ];
  const uniqueEntries = [...new Map(entries.map((entry) => [entry.path, entry])).values()];
  const urls = uniqueEntries.map(({ path, lastmod, images = [] }) => {
    const imageTags = [...new Set(images)].map((image) => (
      `    <image:image>\n      <image:loc>${xmlEscape(image)}</image:loc>\n    </image:image>`
    ));
    return [
      "  <url>",
      `    <loc>${xmlEscape(`${origin}${path}`)}</loc>`,
      ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
      ...imageTags,
      "  </url>",
    ].join("\n");
  }).join("\n");

  await writeFile(
    new URL("../public/sitemap.xml", import.meta.url),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`,
  );

  const imageCount = uniqueEntries.reduce((total, entry) => total + new Set(entry.images ?? []).size, 0);
  console.log(
    `Generated sitemap with ${uniqueEntries.length} URLs and ${imageCount} images `
    + `(${productPages.length} products, ${brandPages.length} brands, `
    + `${subcategoryPages.length} subcategories, ${guidePages.length} guides)`,
  );
} finally {
  await prisma.$disconnect();
}
