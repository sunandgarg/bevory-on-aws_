import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma, PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { LEGACY_CATALOG_CATEGORY_SLUGS, LIVCHEERS_CATEGORY_DEFINITIONS } from "../src/lib/catalogTaxonomy.js";

type CitySlug = "delhi" | "faridabad" | "goa" | "gurgaon";

type SourceSpec = {
  city: string;
  citySlug: CitySlug;
  path: string;
};

type CsvRow = {
  record_id?: string;
  brand_name: string;
  product_name: string;
  variant_name: string;
  volume_ml: string;
  price_inr: string;
  currency: string;
  city: string;
  source_category: string;
  site_product_name: string;
  source_url: string;
  price_evidence: string;
  source_accessed_on: string;
  known_product_url?: string;
  price_basis?: string;
  price_conflict?: string;
  price_anomaly_flag?: string;
  price_anomaly_reason?: string;
};

type ParsedRow = CsvRow & {
  source: SourceSpec;
  sourceIndex: number;
  price: number;
  volumeMl: number;
  categorySlugs: string[];
  productKey: string;
  brandKey: string;
  variantKey: string;
};

export type ProductEnrichment = {
  citySlug: CitySlug;
  categorySlug: string;
  brandName: string;
  productName: string;
  volumeMl: number;
  typeName: string | null;
  imageUrl: string | null;
  price: number | null;
  productUrl: string;
  sourcePage: string;
};

type ImportIssue = {
  level: "warning" | "error";
  code: string;
  source?: string;
  recordId?: string;
  message: string;
};

type PlannedRecord = {
  tableName: string;
  recordId: string;
  data: Prisma.InputJsonObject;
};

type ImportReport = {
  startedAt: string;
  finishedAt?: string;
  dryRun: boolean;
  sources: Array<{
    city: string;
    file: string;
    rows: number;
    acceptedPrices: number;
    skippedRows: number;
  }>;
  enrichment: {
    enabled: boolean;
    categoryPagesRequested: number;
    categoryPagesFetched: number;
    cardsParsed: number;
    matchedVariants: number;
    productsWithVerifiedImages: number;
    brandsWithVerifiedLogos: number;
    imageTargetWidth: number;
    imageResolutionNote: string;
    licensingNote: string;
  };
  planned: Record<string, number>;
  written: Record<string, number>;
  issues: ImportIssue[];
};

const CATEGORY_SLUGS = new Set<string>(LIVCHEERS_CATEGORY_DEFINITIONS.map(([slug]) => slug));

const CATEGORY_OVERRIDES = new Map<string, string>([
  ["dewars|white label", "blended-scotch"],
  ["grover|art collection cab shiraz", "red-wine"],
  ["grover|art collection chenin blanc", "white-wine"],
  ["jim beam|jim beam", "world-whisky"],
  ["noble|casa noble blanco tequila", "tequila"],
  ["sierra|tequila repsado", "tequila"],
  ["sula|seco rose", "rose-wine"],
  ["teachers|highland cream", "blended-scotch"],
]);

const SOURCE_PRIORITY: Record<CitySlug, number> = {
  delhi: 1,
  goa: 2,
  gurgaon: 3,
  faridabad: 4,
};

const slugify = (value: string) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "") || "item";

export const normalizeIdentity = (value: string) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/&/g, "and")
  .replace(/[^a-z0-9]+/g, "")
  .trim();

export const parseCategorySlugs = (value: string) => [...new Set(value
  .split(/[|;]/)
  .map((category) => slugify(category))
  .filter(Boolean))];

export const mergeUniqueNumbers = (existing: unknown, incoming: number[]) => {
  const previous = Array.isArray(existing)
    ? existing.map(Number).filter((value) => Number.isInteger(value) && value > 0)
    : [];
  return [...new Set([...previous, ...incoming])].sort((left, right) => right - left);
};

export const mergeUniqueStrings = (existing: unknown, incoming: Array<string | null | undefined>) => {
  const previous = Array.isArray(existing)
    ? existing.filter((value): value is string => typeof value === "string")
    : [];
  return [...new Set([...previous, ...incoming]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value)))];
};

const stableId = (namespace: string, value: string) => {
  const digest = createHash("sha256").update(value).digest("hex").slice(0, 24);
  return `lc-${namespace}-${digest}`;
};

const productKeyFor = (brandName: string, productName: string) =>
  `${normalizeIdentity(brandName)}|${normalizeIdentity(productName)}`;

const variantLookupKey = (citySlug: CitySlug, productName: string, volumeMl: number) =>
  `${citySlug}|${normalizeIdentity(productName)}|${volumeMl}`;

const groupBy = <T>(items: T[], keyFor: (item: T) => string) => {
  const grouped = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keyFor(item);
    const group = grouped.get(key);
    if (group) group.push(item);
    else grouped.set(key, [item]);
  });
  return grouped;
};

const decodeHtml = (value: string) => value
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#x27;|&#39;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&nbsp;/g, " ")
  .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)));

const textContent = (html: string) => decodeHtml(html.replace(/<[^>]*>/g, " "))
  .replace(/\s+/g, " ")
  .trim();

const attribute = (tag: string, name: string) => {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return match ? decodeHtml(match[1]) : null;
};

export const parseCategoryCards = (
  html: string,
  citySlug: CitySlug,
  categorySlug: string,
  sourcePage: string,
): ProductEnrichment[] => {
  const results: ProductEnrichment[] = [];
  const anchorPattern = new RegExp(
    `<a\\b([^>]*\\bhref="/${citySlug}/liquor/[^"]+"[^>]*)>([\\s\\S]*?)<\\/a>`,
    "gi",
  );

  for (const match of html.matchAll(anchorPattern)) {
    const openingAttributes = match[1];
    const body = match[2];
    const href = attribute(`<a ${openingAttributes}>`, "href");
    const imageTag = body.match(/<img\b[^>]*>/i)?.[0] ?? "";
    const imageUrl = attribute(imageTag, "src");
    const heading = body.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1];
    const productName = heading ? textContent(heading) : attribute(imageTag, "alt");
    if (!href || !productName) continue;

    const volumeMatches = [...body.matchAll(/<p\b[^>]*>\s*([0-9.]+)\s*(ML|L)\b[^<]*<\/p>/gi)];
    const volumeMatch = volumeMatches.at(-1);
    const volumeText = volumeMatch ? `${volumeMatch[1]}${volumeMatch[2]}` : "";
    const volumeNumber = Number.parseFloat(volumeText.replace(/[^0-9.]/g, ""));
    const volumeMl = volumeMatch?.[2].toUpperCase() === "L"
      ? Math.round(volumeNumber * 1000)
      : Math.round(volumeNumber);
    if (!Number.isFinite(volumeMl) || volumeMl <= 0) continue;

    const brandMatch = body.match(/<p\b[^>]*text-\[#007CF5\][^>]*>([\s\S]*?)<\/p>/i);
    const brandName = brandMatch ? textContent(brandMatch[1]) : "";
    const typeMatch = body.match(/<span\b[^>]*bg-\[#F4F5F5\][^>]*>([\s\S]*?)<\/span>/i);
    const typeName = typeMatch ? textContent(typeMatch[1]) : null;
    const priceMatch = textContent(body).match(/₹\s*([0-9][0-9,]*)/);
    const price = priceMatch ? Number(priceMatch[1].replace(/,/g, "")) : null;

    results.push({
      citySlug,
      categorySlug,
      brandName,
      productName,
      volumeMl,
      typeName: typeName || null,
      imageUrl: imageUrl?.startsWith("http") ? imageUrl : null,
      price: price && Number.isFinite(price) ? price : null,
      productUrl: new URL(href, "https://www.livcheers.com").toString(),
      sourcePage,
    });
  }

  return results;
};

const parseArguments = () => {
  const args = process.argv.slice(2);
  const valueFor = (flag: string) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const definitions: Array<{ flag: string; city: string; citySlug: CitySlug }> = [
    { flag: "--delhi", city: "Delhi", citySlug: "delhi" },
    { flag: "--goa", city: "Goa", citySlug: "goa" },
    { flag: "--gurgaon", city: "Gurgaon", citySlug: "gurgaon" },
    { flag: "--faridabad", city: "Faridabad", citySlug: "faridabad" },
  ];
  const sources = definitions.flatMap((definition) => {
    const path = valueFor(definition.flag);
    return path ? [{ city: definition.city, citySlug: definition.citySlug, path: resolve(path) }] : [];
  });
  if (!sources.length) {
    throw new Error("Provide at least one source: --delhi, --goa, --gurgaon, or --faridabad <csv>.");
  }
  return {
    sources: sources satisfies SourceSpec[],
    dryRun: args.includes("--dry-run"),
    enrich: !args.includes("--skip-enrichment"),
    verifyBrandLogos: !args.includes("--skip-brand-logos"),
    reportPath: resolve(valueFor("--report") ?? "reports/livcheers-import-report.json"),
  };
};

const parseBoolean = (value: string | undefined) => value?.trim().toLowerCase() === "true";

const readSourceRows = async (source: SourceSpec, issues: ImportIssue[]) => {
  const csv = await readFile(source.path, "utf8");
  const rows = parse(csv, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as CsvRow[];
  const accepted: ParsedRow[] = [];

  rows.forEach((row, sourceIndex) => {
    const recordId = row.record_id || `${source.citySlug}-${sourceIndex + 2}`;
    const issue = (code: string, message: string, level: ImportIssue["level"] = "error") => {
      issues.push({ level, code, source: source.path, recordId, message });
    };
    const brandName = row.brand_name?.trim();
    const productName = row.product_name?.trim();
    const price = Number(row.price_inr?.replace(/,/g, ""));
    const volumeMl = Number(row.volume_ml);
    const categorySlugs = parseCategorySlugs(row.source_category ?? "");

    if (!brandName || !productName) return issue("missing_identity", "Brand or product name is missing.");
    if (normalizeIdentity(row.city) !== normalizeIdentity(source.city)) {
      return issue("city_mismatch", `Expected ${source.city}, found ${row.city || "blank"}.`);
    }
    if ((row.currency || "INR").toUpperCase() !== "INR") {
      return issue("unsupported_currency", `Expected INR, found ${row.currency}.`);
    }
    if (!Number.isFinite(price) || price <= 0) return issue("missing_price", "A positive INR price is required.");
    if (!Number.isInteger(volumeMl) || volumeMl <= 0) return issue("invalid_volume", `Invalid volume_ml: ${row.volume_ml}.`);
    const unknownCategories = categorySlugs.filter((slug) => !CATEGORY_SLUGS.has(slug));
    if (!categorySlugs.length || unknownCategories.length) {
      return issue("unknown_category", `Unsupported category: ${row.source_category || "blank"}.`);
    }
    if (categorySlugs.length > 1) {
      issue("multi_category_source", `Source lists multiple categories: ${categorySlugs.join(", ")}.`, "warning");
    }
    if (parseBoolean(row.price_conflict)) {
      issue("source_price_conflict", "The source row flags a price conflict; imported with review metadata.", "warning");
    }
    if (parseBoolean(row.price_anomaly_flag)) {
      issue(
        "source_price_anomaly",
        row.price_anomaly_reason || "The source row flags a price anomaly; imported with review metadata.",
        "warning",
      );
    }

    const productKey = productKeyFor(brandName, productName);
    accepted.push({
      ...row,
      source,
      sourceIndex,
      price,
      volumeMl,
      categorySlugs,
      productKey,
      brandKey: normalizeIdentity(brandName),
      variantKey: `${productKey}|${volumeMl}`,
    });
  });

  return { rows, accepted };
};

const fetchWithRetry = async (url: string, method: "GET" | "HEAD" = "GET") => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        method,
        headers: { "user-agent": "Bevory catalogue verification/1.0 (+https://bevory.in)" },
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok) return response;
      lastError = new Error(`${response.status} ${response.statusText}`);
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 750));
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed");
};

const mapConcurrent = async <T, R>(items: T[], concurrency: number, task: (item: T) => Promise<R>) => {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await task(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
};

const crawlCategoryPages = async (sources: SourceSpec[], report: ImportReport) => {
  const pages = sources.flatMap((source) => LIVCHEERS_CATEGORY_DEFINITIONS.map(([categorySlug]) => ({
    source,
    categorySlug,
    url: `https://www.livcheers.com/${source.citySlug}/category/${categorySlug}`,
  })));
  report.enrichment.categoryPagesRequested = pages.length;

  const pageResults = await mapConcurrent(pages, 6, async (page) => {
    try {
      const response = await fetchWithRetry(page.url);
      const html = await response.text();
      report.enrichment.categoryPagesFetched += 1;
      return parseCategoryCards(html, page.source.citySlug, page.categorySlug, page.url);
    } catch (error) {
      report.issues.push({
        level: "warning",
        code: "category_page_fetch_failed",
        source: page.url,
        message: error instanceof Error ? error.message : "Unknown request error",
      });
      return [];
    }
  });
  const cards = pageResults.flat();
  report.enrichment.cardsParsed = cards.length;
  return cards;
};

const verifiedBrandLogos = async (brandNames: string[], report: ImportReport) => {
  const result = new Map<string, string>();
  await mapConcurrent(brandNames, 10, async (brandName) => {
    const logoUrl = `https://static.livcheers.com/static/content/images/brand/${slugify(brandName)}.webp`;
    try {
      const response = await fetchWithRetry(logoUrl, "HEAD");
      if (response.headers.get("content-type")?.startsWith("image/")) {
        result.set(normalizeIdentity(brandName), logoUrl);
      }
    } catch {
      // Missing logo candidates are reported as a count, not one warning per brand.
    }
  });
  report.enrichment.brandsWithVerifiedLogos = result.size;
  return result;
};

const jsonObject = (value: Prisma.JsonValue | undefined): Prisma.JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Prisma.JsonObject : {};

const choosePrimaryCategory = (productKey: string, rows: ParsedRow[]) => {
  const readableOverrideKey = `${rows[0].brand_name.trim().toLowerCase()}|${rows[0].product_name.trim().toLowerCase()}`;
  const override = CATEGORY_OVERRIDES.get(readableOverrideKey);
  if (override) return override;

  const scores = new Map<string, number>();
  rows.forEach((row) => {
    const evidenceWeight = /product_page/i.test(row.price_evidence) ? 4 : /brand_page/i.test(row.price_evidence) ? 2 : 1;
    row.categorySlugs.forEach((slug) => scores.set(
      slug,
      (scores.get(slug) ?? 0) + evidenceWeight + SOURCE_PRIORITY[row.source.citySlug],
    ));
  });
  return [...scores.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0]
    ?? LIVCHEERS_CATEGORY_DEFINITIONS[0][0];
};

const MATCH_STOP_WORDS = new Set([
  "and", "beer", "brandy", "drink", "liquor", "rtd", "soda", "tequila", "the", "vodka", "whiskey", "whisky", "wine",
]);

const MATCH_TOKEN_ALIASES: Record<string, string> = {
  anojo: "anejo",
  cab: "cabernet",
  rosato: "rose",
  sauv: "sauvignon",
};

const matchTokens = (value: string) => new Set(value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .split(/[^a-z0-9]+/)
  .filter(Boolean)
  .map((token) => MATCH_TOKEN_ALIASES[token] ?? token)
  .filter((token) => !MATCH_STOP_WORDS.has(token)));

const tokenSimilarity = (left: string, right: string) => {
  const leftTokens = matchTokens(left);
  const rightTokens = matchTokens(right);
  if (!leftTokens.size || !rightTokens.size) return 0;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return intersection / union;
};

const productPath = (value: string | undefined) => {
  if (!value) return "";
  try {
    return new URL(value).pathname.replace(/^\/(?:delhi|faridabad|goa|gurgaon)/, "");
  } catch {
    return "";
  }
};

const enrichmentMatchScore = (row: ParsedRow, item: ProductEnrichment) => {
  if (row.source.citySlug !== item.citySlug || row.volumeMl !== item.volumeMl) return 0;
  const rowNames = [
    row.site_product_name,
    `${row.brand_name} ${row.product_name}`,
    row.product_name,
  ].filter(Boolean);
  const itemNames = [item.productName, `${item.brandName} ${item.productName}`];
  if (rowNames.some((left) => itemNames.some((right) => normalizeIdentity(left) === normalizeIdentity(right)))) return 100;
  if (productPath(row.known_product_url) && productPath(row.known_product_url) === productPath(item.productUrl)) return 95;
  const similarity = Math.max(...rowNames.flatMap((left) => itemNames.map((right) => tokenSimilarity(left, right))));
  return similarity >= 0.72 ? 70 + similarity * 20 : 0;
};

export const pickProductEnrichment = (rows: ParsedRow[], enrichments: ProductEnrichment[]) => {
  const candidates = rows.flatMap((row) => enrichments
    .map((item) => ({ item, matchScore: enrichmentMatchScore(row, item) }))
    .filter(({ matchScore }) => matchScore > 0));
  const unique = new Map<string, { item: ProductEnrichment; matchScore: number }>();
  candidates.forEach((candidate) => {
    const key = `${candidate.item.productUrl}|${candidate.item.categorySlug}`;
    if ((unique.get(key)?.matchScore ?? 0) < candidate.matchScore) unique.set(key, candidate);
  });
  return [...unique.values()].sort((left, right) => {
    const leftScore = left.matchScore * 100 + (left.item.imageUrl ? 100 : 0) + (left.item.volumeMl === 750 ? 20 : 0) + SOURCE_PRIORITY[left.item.citySlug];
    const rightScore = right.matchScore * 100 + (right.item.imageUrl ? 100 : 0) + (right.item.volumeMl === 750 ? 20 : 0) + SOURCE_PRIORITY[right.item.citySlug];
    return rightScore - leftScore;
  }).map(({ item }) => item);
};

const buildRecords = async (
  prisma: PrismaClient,
  rows: ParsedRow[],
  enrichments: ProductEnrichment[],
  brandLogos: Map<string, string>,
  report: ImportReport,
) => {
  const now = new Date().toISOString();
  const tableNames = ["app_settings", "brand_spotlights", "categories", "cities", "product_prices", "products", "sub_categories"];
  const existingRecords = await prisma.contentRecord.findMany({ where: { tableName: { in: tableNames } } });
  const existingByKey = new Map(existingRecords.map((record) => [record.key, jsonObject(record.data)]));
  const records = new Map<string, PlannedRecord>();
  const setRecord = (tableName: string, recordId: string, managedData: Prisma.InputJsonObject) => {
    const key = `${tableName}:${recordId}`;
    const previous = existingByKey.get(key) ?? {};
    records.set(key, {
      tableName,
      recordId,
      data: {
        ...previous,
        ...managedData,
        id: recordId,
        created_at: previous.created_at ?? now,
        updated_at: now,
      },
    });
  };

  const cities = existingRecords
    .filter((record) => record.tableName === "cities")
    .map((record) => ({ id: record.recordId, data: jsonObject(record.data) }));
  const cityIdByName = new Map(cities.map(({ id, data }) => [normalizeIdentity(String(data.name ?? "")), id]));
  for (const source of new Set(rows.map((row) => row.source))) {
    if (!cityIdByName.has(normalizeIdentity(source.city))) {
      throw new Error(`City ${source.city} is missing. Run pnpm db:seed before importing the catalogue.`);
    }
  }

  const categoryIds = new Map<string, string>();
  LIVCHEERS_CATEGORY_DEFINITIONS.forEach(([slug, name, imageEmoji, description], orderIndex) => {
    const existing = existingRecords.find((record) => record.tableName === "categories" && jsonObject(record.data).slug === slug);
    const id = existing?.recordId ?? stableId("category", slug);
    categoryIds.set(slug, id);
    setRecord("categories", id, {
      name,
      slug,
      emoji: imageEmoji,
      description,
      order_index: orderIndex,
      is_active: true,
      is_trending: orderIndex < 10,
      source_name: "Livcheers",
      source_url: `https://www.livcheers.com/delhi/category/${slug}`,
      source_verified_at: now,
    });
  });
  existingRecords
    .filter((record) => record.tableName === "categories" && LEGACY_CATALOG_CATEGORY_SLUGS.has(String(jsonObject(record.data).slug)))
    .forEach((record) => setRecord("categories", record.recordId, { is_active: false, replaced_by_imported_taxonomy: true }));

  const subcategoryIds = new Map<string, string>();
  enrichments.forEach((item) => {
    if (!item.typeName || !categoryIds.has(item.categorySlug)) return;
    const key = `${item.categorySlug}|${normalizeIdentity(item.typeName)}`;
    if (subcategoryIds.has(key)) return;
    const slug = `${item.categorySlug}-${slugify(item.typeName)}`;
    const existing = existingRecords.find((record) => record.tableName === "sub_categories" && jsonObject(record.data).slug === slug);
    const id = existing?.recordId ?? stableId("subcategory", key);
    subcategoryIds.set(key, id);
    setRecord("sub_categories", id, {
      category_id: categoryIds.get(item.categorySlug)!,
      name: item.typeName,
      slug,
      is_active: true,
      order_index: 0,
      source_name: "Livcheers",
      source_url: item.sourcePage,
      source_verified_at: now,
    });
  });

  const rowsByBrand = groupBy(rows, (row) => row.brandKey);
  for (const [brandKey, brandRows] of rowsByBrand) {
    const brandName = brandRows[0].brand_name.trim();
    const slug = slugify(brandName);
    const existing = existingRecords.find((record) => record.tableName === "brand_spotlights" && (
      jsonObject(record.data).slug === slug
      || normalizeIdentity(String(jsonObject(record.data).brand_name ?? "")) === brandKey
    ));
    const id = existing?.recordId ?? stableId("brand", brandKey);
    const existingData = jsonObject(existing?.data);
    const logoUrl = brandLogos.get(brandKey);
    setRecord("brand_spotlights", id, {
      brand_name: existingData.brand_name ?? brandName,
      slug: existingData.slug ?? slug,
      logo_url: logoUrl ?? existingData.logo_url ?? null,
      logo_source_url: logoUrl ?? existingData.logo_source_url ?? null,
      logo_identity_verified: logoUrl ? true : Boolean(existingData.logo_identity_verified),
      logo_verified_at: logoUrl ? now : existingData.logo_verified_at ?? null,
      image_license_status: existingData.image_license_status ?? "unverified",
      is_active: true,
      show_in_spotlight: Boolean(existingData.show_in_spotlight),
      imported_from: "livcheers_csv",
    });
  }

  const brandIdByKey = new Map<string, string>();
  for (const [key, planned] of records) {
    if (planned.tableName === "brand_spotlights") {
      brandIdByKey.set(normalizeIdentity(String(planned.data.brand_name)), planned.recordId);
    }
  }

  const rowsByProduct = groupBy(rows, (row) => row.productKey);
  const productIdByKey = new Map<string, string>();
  for (const [productKey, productRows] of rowsByProduct) {
    const brandName = productRows[0].brand_name.trim();
    const productName = productRows[0].product_name.trim();
    const categorySlug = choosePrimaryCategory(productKey, productRows);
    const categorySet = [...new Set(productRows.flatMap((row) => row.categorySlugs))].sort();
    if (categorySet.length > 1) {
      report.issues.push({
        level: "warning",
        code: "product_category_conflict",
        message: `${brandName} ${productName}: ${categorySet.join(", ")}; primary ${categorySlug}.`,
      });
    }
    const matchedEnrichments = pickProductEnrichment(productRows, enrichments);
    const selectedEnrichment = matchedEnrichments[0];
    const typeCounts = new Map<string, number>();
    matchedEnrichments.forEach((item) => {
      if (item.categorySlug === categorySlug && item.typeName) {
        typeCounts.set(item.typeName, (typeCounts.get(item.typeName) ?? 0) + 1);
      }
    });
    const typeName = [...typeCounts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ?? null;
    const subcategoryId = typeName
      ? subcategoryIds.get(`${categorySlug}|${normalizeIdentity(typeName)}`) ?? null
      : null;
    const productSlugBase = `${slugify(brandName)}-${slugify(productName)}`.slice(0, 110).replace(/-$/g, "");
    const productSlug = `${productSlugBase}-${createHash("sha1").update(productKey).digest("hex").slice(0, 7)}`;
    const existing = existingRecords.find((record) => record.tableName === "products" && (
      jsonObject(record.data).catalog_identity === productKey || jsonObject(record.data).slug === productSlug
      || productKeyFor(
        String(jsonObject(record.data).brand ?? ""),
        String(jsonObject(record.data).name ?? ""),
      ) === productKey
    ));
    const productId = existing?.recordId ?? stableId("product", productKey);
    productIdByKey.set(productKey, productId);
    const existingData = jsonObject(existing?.data);
    const volumes = mergeUniqueNumbers(existingData.available_volumes_ml, productRows.map((row) => row.volumeMl));
    const defaultVolume = volumes.includes(750) ? 750 : volumes[0];
    const imageUrl = selectedEnrichment?.imageUrl ?? null;
    if (imageUrl) report.enrichment.productsWithVerifiedImages += 1;
    const readableOverrideKey = `${brandName.toLowerCase()}|${productName.toLowerCase()}`;
    const hasCategoryOverride = CATEGORY_OVERRIDES.has(readableOverrideKey);
    const sourceUrls = mergeUniqueStrings(
      existingData.source_urls,
      productRows.map((row) => row.known_product_url || row.source_url),
    );
    const sourceAccessedOn = mergeUniqueStrings(
      existingData.source_accessed_on ? [String(existingData.source_accessed_on)] : [],
      productRows.map((row) => row.source_accessed_on),
    ).sort().at(-1) ?? null;
    const mergedCategorySlugs = mergeUniqueStrings(existingData.category_slugs, [...categorySet, categorySlug]).sort();

    setRecord("products", productId, {
      brand_id: brandIdByKey.get(productRows[0].brandKey) ?? null,
      brand: existingData.brand ?? brandName,
      name: existingData.name ?? productName,
      slug: existingData.slug ?? productSlug,
      catalog_identity: existingData.catalog_identity ?? productKey,
      category_id: hasCategoryOverride ? categoryIds.get(categorySlug)! : existingData.category_id ?? categoryIds.get(categorySlug)!,
      category_slugs: mergedCategorySlugs,
      sub_category_id: hasCategoryOverride ? subcategoryId : existingData.sub_category_id ?? subcategoryId,
      type_tag: hasCategoryOverride ? typeName : existingData.type_tag ?? typeName,
      available_volumes_ml: volumes,
      volume: existingData.volume ?? `${defaultVolume}ml`,
      image_url: imageUrl ?? existingData.image_url ?? null,
      image_source_url: imageUrl ?? existingData.image_source_url ?? null,
      image_source_page: imageUrl ? selectedEnrichment?.productUrl ?? null : existingData.image_source_page ?? null,
      image_identity_verified: imageUrl ? true : Boolean(existingData.image_identity_verified),
      image_verified_at: imageUrl ? now : existingData.image_verified_at ?? null,
      image_target_width: 720,
      image_license_status: existingData.image_license_status ?? "unverified",
      source_name: existingData.source_name ?? "Livcheers",
      source_urls: sourceUrls,
      source_accessed_on: sourceAccessedOn,
      is_active: true,
      is_trending: Boolean(existingData.is_trending),
      is_all_time_favourite: Boolean(existingData.is_all_time_favourite),
      imported_from: "livcheers_csv",
    });
  }

  let matchedVariants = 0;
  for (const row of rows) {
    const productId = productIdByKey.get(row.productKey)!;
    const cityId = cityIdByName.get(normalizeIdentity(row.source.city))!;
    const priceId = stableId("price", `${productId}|${cityId}|${row.volumeMl}`);
    const matched = pickProductEnrichment([row], enrichments)[0];
    if (matched) matchedVariants += 1;
    setRecord("product_prices", priceId, {
      product_id: productId,
      city_id: cityId,
      variant_name: row.variant_name || `${row.volumeMl} ml`,
      volume: `${row.volumeMl}ml`,
      volume_ml: row.volumeMl,
      price: row.price,
      mrp: null,
      currency: "INR",
      price_available: true,
      in_stock: true,
      availability_verified: false,
      source_name: "Livcheers",
      source_record_id: row.record_id || null,
      source_url: row.known_product_url || matched?.productUrl || row.source_url,
      source_category: row.source_category,
      source_accessed_on: row.source_accessed_on || null,
      price_evidence: row.price_evidence || null,
      price_basis: row.price_basis || null,
      price_conflict: parseBoolean(row.price_conflict),
      price_anomaly_flag: parseBoolean(row.price_anomaly_flag),
      price_anomaly_reason: row.price_anomaly_reason || null,
      requires_review: parseBoolean(row.price_conflict) || parseBoolean(row.price_anomaly_flag),
      source_price_matches_current: matched?.price === row.price,
      source_price_verified_at: matched?.price === row.price ? now : null,
      imported_from: "livcheers_csv",
    });
  }
  report.enrichment.matchedVariants = matchedVariants;

  const ageSetting = existingRecords.find((record) => record.tableName === "app_settings" && jsonObject(record.data).key === "age_verification");
  const ageValue = jsonObject(jsonObject(ageSetting?.data).value);
  const ageId = ageSetting?.recordId ?? stableId("setting", "age_verification");
  setRecord("app_settings", ageId, {
    key: "age_verification",
    description: "Age verification popup settings",
    value: {
      ...ageValue,
      enabled: ageValue.enabled ?? true,
      defaultCity: ageValue.defaultCity ?? "Gurgaon",
      title: "Are you 25 or older?",
      description: "You must be 25 or older to access Bevory.",
      confirmButtonText: "Yes, I am 25+",
      declineButtonText: ageValue.declineButtonText ?? "No, I am not",
      termsText: ageValue.termsText ?? "By entering this website, you agree to our Terms of Service and Privacy Policy.",
      minimumAge: 25,
    },
  });

  return [...records.values()];
};

const applyRecords = async (prisma: PrismaClient, records: PlannedRecord[], report: ImportReport) => {
  const batches: PlannedRecord[][] = [];
  for (let index = 0; index < records.length; index += 100) batches.push(records.slice(index, index + 100));
  for (const batch of batches) {
    await prisma.$transaction(batch.map((record) => prisma.contentRecord.upsert({
      where: { key: `${record.tableName}:${record.recordId}` },
      update: { data: record.data },
      create: {
        key: `${record.tableName}:${record.recordId}`,
        tableName: record.tableName,
        recordId: record.recordId,
        data: record.data,
      },
    })));
    batch.forEach((record) => {
      report.written[record.tableName] = (report.written[record.tableName] ?? 0) + 1;
    });
  }
};

const writeReport = async (reportPath: string, report: ImportReport) => {
  report.finishedAt = new Date().toISOString();
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
};

export const main = async () => {
  const options = parseArguments();
  const report: ImportReport = {
    startedAt: new Date().toISOString(),
    dryRun: options.dryRun,
    sources: [],
    enrichment: {
      enabled: options.enrich,
      categoryPagesRequested: 0,
      categoryPagesFetched: 0,
      cardsParsed: 0,
      matchedVariants: 0,
      productsWithVerifiedImages: 0,
      brandsWithVerifiedLogos: 0,
      imageTargetWidth: 720,
      imageResolutionNote: "Images are served through Bevory's responsive 720px transform. Source pixel dimensions vary and are not represented as native 720p.",
      licensingNote: "External image identity was verified from Livcheers pages; reuse rights remain unverified. URLs are linked, not copied into Bevory storage.",
    },
    planned: {},
    written: {},
    issues: [],
  };
  const acceptedRows: ParsedRow[] = [];

  for (const source of options.sources) {
    const parsedSource = await readSourceRows(source, report.issues);
    acceptedRows.push(...parsedSource.accepted);
    report.sources.push({
      city: source.city,
      file: source.path,
      rows: parsedSource.rows.length,
      acceptedPrices: parsedSource.accepted.length,
      skippedRows: parsedSource.rows.length - parsedSource.accepted.length,
    });
  }

  const duplicatePriceKeys = groupBy(
    acceptedRows,
    (row) => `${row.source.citySlug}|${row.productKey}|${row.volumeMl}`,
  );
  const deduplicatedRows: ParsedRow[] = [];
  for (const [key, duplicates] of duplicatePriceKeys) {
    if (duplicates.length > 1) {
      report.issues.push({
        level: "warning",
        code: "duplicate_price_key",
        message: `${key} appeared ${duplicates.length} times; the latest source row was used.`,
      });
    }
    deduplicatedRows.push(duplicates.at(-1)!);
  }

  const enrichments = options.enrich ? await crawlCategoryPages(options.sources, report) : [];
  const brandNames = [...new Set(deduplicatedRows.map((row) => row.brand_name.trim()))].sort();
  const brandLogos = options.enrich && options.verifyBrandLogos
    ? await verifiedBrandLogos(brandNames, report)
    : new Map<string, string>();

  const prisma = new PrismaClient();
  try {
    const records = await buildRecords(prisma, deduplicatedRows, enrichments, brandLogos, report);
    records.forEach((record) => {
      report.planned[record.tableName] = (report.planned[record.tableName] ?? 0) + 1;
    });
    if (!options.dryRun) await applyRecords(prisma, records, report);
  } finally {
    await prisma.$disconnect();
  }

  await writeReport(options.reportPath, report);
  const summary = {
    report: options.reportPath,
    dryRun: options.dryRun,
    sources: report.sources,
    planned: report.planned,
    written: report.written,
    enrichment: report.enrichment,
    warnings: report.issues.filter((issue) => issue.level === "warning").length,
    errors: report.issues.filter((issue) => issue.level === "error").length,
  };
  console.log(JSON.stringify(summary, null, 2));
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
