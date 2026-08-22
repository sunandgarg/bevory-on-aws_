import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma, toRecordData } from "../db.js";

type ProviderPrice = {
  product_id?: string;
  product_name?: string;
  name?: string;
  brand?: string;
  volume?: string;
  price?: number | string;
  mrp?: number | string;
  in_stock?: boolean;
};

export const priceProviderConfigured = () => Boolean(process.env.PRICE_PROVIDER_URL?.trim());
const normalized = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const providerRows = async (cityName: string) => {
  const configuredUrl = process.env.PRICE_PROVIDER_URL?.trim();
  if (!configuredUrl) throw new Error("PRICE_PROVIDER_URL is not configured");
  const url = new URL(configuredUrl);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("PRICE_PROVIDER_URL must use HTTPS in production");
  }
  url.searchParams.set("city", cityName);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.PRICE_PROVIDER_KEY) {
    headers[process.env.PRICE_PROVIDER_KEY_HEADER?.trim() || "Authorization"] =
      process.env.PRICE_PROVIDER_KEY_HEADER?.trim()
        ? process.env.PRICE_PROVIDER_KEY
        : `Bearer ${process.env.PRICE_PROVIDER_KEY}`;
  }
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
  const body = await response.json().catch(() => ({})) as {
    items?: ProviderPrice[];
    prices?: ProviderPrice[];
    data?: ProviderPrice[];
  } | ProviderPrice[];
  if (!response.ok) throw new Error(`Price provider failed (${response.status})`);
  const rows = Array.isArray(body) ? body : body.items || body.prices || body.data || [];
  if (!Array.isArray(rows)) throw new Error("Price provider response must contain an array");
  return rows;
};

export const importCityPrices = async (cityId: string, cityName: string) => {
  const [products, incoming] = await Promise.all([
    prisma.contentRecord.findMany({ where: { tableName: "products" } }),
    providerRows(cityName),
  ]);
  const catalog = products.map((record) => toRecordData(record.data));
  const existingPrices = await prisma.contentRecord.findMany({ where: { tableName: "product_prices" } });
  const existingByComposite = new Map<string, { recordId: string; data: Record<string, unknown> }>(existingPrices.map((record) => {
    const row = toRecordData(record.data);
    return [`${row.product_id}:${row.city_id}:${String(row.volume || "750ml")}`, {
      recordId: record.recordId,
      data: row,
    }] as const;
  }));
  let matched = 0;
  let upserted = 0;
  const unmatched: string[] = [];
  for (const item of incoming) {
    const product = item.product_id
      ? catalog.find((candidate) => candidate.id === item.product_id)
      : catalog.find((candidate) =>
        normalized(candidate.name) === normalized(item.product_name ?? item.name)
        && (!item.brand || normalized(candidate.brand) === normalized(item.brand)));
    const price = Number(item.price);
    if (!product || !Number.isFinite(price) || price <= 0) {
      unmatched.push(`${item.brand ?? ""} ${item.product_name ?? item.name ?? item.product_id ?? "unknown"}`.trim());
      continue;
    }
    matched++;
    const volume = String(item.volume || "750ml");
    const compositeKey = `${product.id}:${cityId}:${volume}`;
    const record = existingByComposite.get(compositeKey);
    const recordId = record?.recordId || randomUUID();
    const previous = record?.data || {};
    const now = new Date().toISOString();
    const data = {
      ...previous,
      id: recordId,
      product_id: product.id,
      city_id: cityId,
      volume,
      price,
      mrp: item.mrp == null ? previous.mrp ?? null : Number(item.mrp),
      in_stock: item.in_stock ?? true,
      source: "configured-price-provider",
      last_updated: now,
      updated_at: now,
      created_at: previous.created_at ?? now,
    } as Prisma.InputJsonObject;
    await prisma.contentRecord.upsert({
      where: { key: `product_prices:${recordId}` },
      update: { data },
      create: { key: `product_prices:${recordId}`, tableName: "product_prices", recordId, data },
    });
    existingByComposite.set(compositeKey, { recordId, data: data as Record<string, unknown> });
    upserted++;
  }
  return {
    success: true,
    provider: new URL(process.env.PRICE_PROVIDER_URL!).hostname,
    total_scraped: incoming.length,
    matched,
    upserted,
    unmatched_count: unmatched.length,
    unmatched: unmatched.slice(0, 50),
  };
};
