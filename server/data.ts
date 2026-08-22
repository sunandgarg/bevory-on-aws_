import type { Response } from "express";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import type { AuthenticatedRequest } from "./auth.js";
import { userIsAdmin } from "./auth.js";
import { prisma, toRecordData } from "./db.js";

const TABLES = new Set([
  "announcements", "app_settings", "blog_posts", "brand_spotlights", "categories",
  "cheers_guides", "cities", "cocktails", "comparisons", "content_drafts", "countries",
  "help_support_items", "notifications", "party_recommendations", "preferred_brands",
  "product_prices", "product_reviews", "product_types", "products", "profiles",
  "recent_searches", "saved_locations", "spiritz_magazine", "states", "sub_categories",
  "user_favorites", "user_permissions", "user_preferences", "user_roles", "video_categories",
  "video_creators", "video_reviews",
]);

const USER_TABLES = new Set([
  "comparisons", "notifications", "preferred_brands", "profiles", "recent_searches",
  "saved_locations", "user_favorites", "user_permissions", "user_preferences", "user_roles",
]);

const UNIQUE_COLUMNS: Record<string, string> = {
  app_settings: "key",
  blog_posts: "slug",
  brand_spotlights: "slug",
  categories: "slug",
  cheers_guides: "slug",
  cocktails: "slug",
  countries: "code",
  products: "slug",
  spiritz_magazine: "slug",
  sub_categories: "slug",
  video_creators: "slug",
  video_reviews: "slug",
};

type Filter = {
  column?: string;
  operator: string;
  value?: unknown;
  filters?: Filter[];
};

export type QueryPayload = {
  table: string;
  operation: "select" | "insert" | "update" | "delete" | "upsert";
  values?: Record<string, unknown> | Array<Record<string, unknown>>;
  filters?: Filter[];
  orders?: Array<{ column: string; ascending?: boolean }>;
  limit?: number;
  range?: [number, number];
  count?: "exact";
  head?: boolean;
  onConflict?: string;
};

const jsonSafe = (value: Record<string, unknown>) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;

const stripCredentialFields = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripCredentialFields);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !/(secret|token|password|credential|service.?account|api.?key)/i.test(key))
    .map(([key, nested]) => [key, stripCredentialFields(nested)]));
};

const safeTableInput = (table: string, value: Record<string, unknown>) =>
  table === "app_settings"
    ? stripCredentialFields(value) as Record<string, unknown>
    : value;

const PUBLIC_REVIEW_INSERT_COLUMNS = new Set([
  "product_id", "rating", "reviewer_name", "content", "taste_rating", "value_rating", "rebuy_rating",
  "is_approved", "is_featured", "is_reported",
]);

const publicReviewReport = (payload: QueryPayload) => {
  if (payload.table !== "product_reviews" || payload.operation !== "update") return false;
  const changes = Array.isArray(payload.values) ? payload.values[0] : payload.values;
  const filters = payload.filters ?? [];
  return Boolean(
    changes
    && changes.is_reported === true
    && Object.keys(changes).every((key) => ["is_reported", "report_reason", "reported_at"].includes(key))
    && filters.length === 1
    && filters[0].column === "id"
    && filters[0].operator === "eq"
    && typeof filters[0].value === "string"
    && filters[0].value.length > 0,
  );
};

const publicReviewInsert = (payload: QueryPayload) =>
  payload.table === "product_reviews"
  && payload.operation === "insert"
  && Boolean(payload.values)
  && (!Array.isArray(payload.values) || payload.values.length === 1);

export const queryAccessAllowed = (payload: QueryPayload, hasUser: boolean, isAdmin: boolean) => {
  if (payload.operation === "select" && !USER_TABLES.has(payload.table)) return true;
  if (isAdmin) return true;
  if (payload.table === "product_reviews") {
    return publicReviewInsert(payload) || publicReviewReport(payload);
  }
  if (!hasUser) return false;
  return USER_TABLES.has(payload.table)
    && payload.table !== "user_roles"
    && payload.table !== "user_permissions";
};

const boundedRating = (value: unknown, field: string) => {
  if (value == null || value === "") return null;
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error(`${field} must be an integer from 1 to 5`);
  return rating;
};

const sanitizePublicReviewInsert = (input: Record<string, unknown>): Record<string, unknown> => {
  const unexpected = Object.keys(input).filter((key) => !PUBLIC_REVIEW_INSERT_COLUMNS.has(key));
  if (unexpected.length) throw new Error(`Unsupported public review field: ${unexpected[0]}`);
  const productId = String(input.product_id ?? "").trim();
  const reviewerName = String(input.reviewer_name ?? "").trim();
  const content = input.content == null ? null : String(input.content).trim() || null;
  const rating = boundedRating(input.rating, "Rating");
  if (!productId || productId.length > 191) throw new Error("A valid product is required");
  if (reviewerName.length < 2 || reviewerName.length > 100) throw new Error("Reviewer name must be 2 to 100 characters");
  if (rating == null) throw new Error("Rating is required");
  if (content && content.length > 2_000) throw new Error("Review content must be at most 2000 characters");
  return {
    product_id: productId,
    rating,
    reviewer_name: reviewerName,
    content,
    taste_rating: boundedRating(input.taste_rating, "Taste rating"),
    value_rating: boundedRating(input.value_rating, "Value rating"),
    rebuy_rating: boundedRating(input.rebuy_rating, "Rebuy rating"),
    is_approved: true,
    is_featured: false,
    is_reported: false,
  };
};

export const scopeWriteInput = (
  payload: QueryPayload,
  input: Record<string, unknown>,
  authUserId: string | undefined,
  isAdmin: boolean,
): Record<string, unknown> => {
  const safeInput = safeTableInput(payload.table, input);
  if (isAdmin) return safeInput;
  if (payload.table === "product_reviews" && payload.operation === "insert") {
    return sanitizePublicReviewInsert(safeInput);
  }
  if (payload.table === "product_reviews" && publicReviewReport(payload)) {
    return {
      is_reported: true,
      report_reason: String(safeInput.report_reason || "Inappropriate content").trim().slice(0, 500),
      reported_at: new Date().toISOString(),
    };
  }
  if (authUserId && USER_TABLES.has(payload.table)) {
    if (payload.table === "profiles") return { ...safeInput, id: authUserId };
    const { id: _untrustedId, ...ownedInput } = safeInput;
    return { ...ownedInput, user_id: authUserId };
  }
  return safeInput;
};

const comparable = (value: unknown) => value instanceof Date ? value.toISOString() : value;

export const matchesFilter = (row: Record<string, unknown>, filter: Filter): boolean => {
  if (filter.operator === "or") return (filter.filters ?? []).some((part) => matchesFilter(row, part));
  const actual = comparable(row[filter.column ?? ""]);
  const expected = comparable(filter.value);
  switch (filter.operator) {
    case "eq": return actual === expected;
    case "neq": return actual !== expected;
    case "gt": return Number(actual) > Number(expected);
    case "gte": return Number(actual) >= Number(expected);
    case "lt": return Number(actual) < Number(expected);
    case "lte": return Number(actual) <= Number(expected);
    case "is": return expected === null ? actual == null : actual === expected;
    case "in": return Array.isArray(expected) && expected.some((item) => item === actual);
    case "ilike": {
      const needle = String(expected ?? "").replaceAll("%", "").toLowerCase();
      return String(actual ?? "").toLowerCase().includes(needle);
    }
    case "contains": return Array.isArray(actual) && Array.isArray(expected)
      && expected.every((item) => actual.includes(item));
    default: return true;
  }
};

const readTable = async (tableName: string) => {
  const records = await prisma.contentRecord.findMany({ where: { tableName } });
  return records.map(({ data }) => toRecordData(data));
};

const attachRelationships = async (table: string, rows: Array<Record<string, unknown>>) => {
  const relationTables = new Set<string>();
  const belongsTo: Record<string, Array<{ aliases: string[]; foreignKey: string; target: string }>> = {
    blog_posts: [{ aliases: ["product", "products"], foreignKey: "linked_product_id", target: "products" }],
    brand_spotlights: [{ aliases: ["product", "products"], foreignKey: "featured_product_id", target: "products" }],
    cities: [{ aliases: ["state", "states"], foreignKey: "state_id", target: "states" }],
    comparisons: [{ aliases: ["city", "cities"], foreignKey: "city_id", target: "cities" }],
    party_recommendations: [{ aliases: ["category", "categories"], foreignKey: "category_id", target: "categories" }],
    preferred_brands: [
      { aliases: ["category", "categories"], foreignKey: "category_id", target: "categories" },
      { aliases: ["product", "products"], foreignKey: "product_id", target: "products" },
    ],
    product_prices: [
      { aliases: ["city", "cities"], foreignKey: "city_id", target: "cities" },
      { aliases: ["product", "products"], foreignKey: "product_id", target: "products" },
    ],
    product_reviews: [{ aliases: ["product", "products"], foreignKey: "product_id", target: "products" }],
    products: [
      { aliases: ["category", "categories"], foreignKey: "category_id", target: "categories" },
      { aliases: ["sub_category", "sub_categories"], foreignKey: "sub_category_id", target: "sub_categories" },
      { aliases: ["product_type", "type", "product_types"], foreignKey: "type_id", target: "product_types" },
    ],
    saved_locations: [{ aliases: ["city", "cities"], foreignKey: "city_id", target: "cities" }],
    states: [{ aliases: ["country", "countries"], foreignKey: "country_id", target: "countries" }],
    sub_categories: [{ aliases: ["category", "categories"], foreignKey: "category_id", target: "categories" }],
    user_favorites: [
      { aliases: ["cocktail", "cocktails"], foreignKey: "cocktail_id", target: "cocktails" },
      { aliases: ["product", "products"], foreignKey: "product_id", target: "products" },
    ],
    video_reviews: [
      { aliases: ["category", "video_categories"], foreignKey: "category_id", target: "video_categories" },
      { aliases: ["creator", "video_creators"], foreignKey: "creator_id", target: "video_creators" },
      { aliases: ["product", "products"], foreignKey: "product_id", target: "products" },
    ],
  };

  for (const relation of belongsTo[table] ?? []) relationTables.add(relation.target);
  if (table === "categories") relationTables.add("products");
  if ([...relationTables].includes("cities") || table === "cities") relationTables.add("states");
  if ([...relationTables].includes("states") || table === "states") relationTables.add("countries");
  const lookup = new Map<string, Array<Record<string, unknown>>>();
  await Promise.all([...relationTables].map(async (name) => lookup.set(name, await readTable(name))));

  const withNestedRelations = (target: string, related: Record<string, unknown> | null) => {
    if (!related) return null;
    if (target === "cities") {
      const state = lookup.get("states")?.find((candidate) => candidate.id === related.state_id) ?? null;
      return { ...related, state, states: state };
    }
    if (target === "states") {
      const country = lookup.get("countries")?.find((candidate) => candidate.id === related.country_id) ?? null;
      return { ...related, country, countries: country };
    }
    return related;
  };

  return rows.map((row) => {
    const enriched = { ...row };
    for (const relation of belongsTo[table] ?? []) {
      const related = lookup.get(relation.target)?.find((candidate) => candidate.id === row[relation.foreignKey]) ?? null;
      const nested = withNestedRelations(relation.target, related);
      for (const alias of relation.aliases) enriched[alias] = nested;
    }
    if (table === "categories") {
      enriched.products = (lookup.get("products") ?? []).filter((product) => product.category_id === row.id);
    }
    return enriched;
  });
};

const canAccess = async (req: AuthenticatedRequest, payload: QueryPayload, isAdmin: boolean) => {
  return queryAccessAllowed(payload, Boolean(req.authUser), isAdmin);
};

const applyUserScope = (req: AuthenticatedRequest, payload: QueryPayload, rows: Array<Record<string, unknown>>, isAdmin: boolean) => {
  if (isAdmin) return rows;
  if (!req.authUser || !USER_TABLES.has(payload.table)) return rows;
  if (payload.table === "profiles") return rows.filter((row) => row.id === req.authUser!.id);
  return rows.filter((row) => row.user_id === req.authUser!.id);
};

const findUpsertRecord = async (table: string, row: Record<string, unknown>, onConflict?: string) => {
  if (row.id) return prisma.contentRecord.findUnique({ where: { key: `${table}:${String(row.id)}` } });
  const uniqueColumn = onConflict || UNIQUE_COLUMNS[table];
  if (!uniqueColumn || row[uniqueColumn] == null) return null;
  const existing = await prisma.contentRecord.findMany({ where: { tableName: table } });
  return existing.find(({ data }) => toRecordData(data)[uniqueColumn] === row[uniqueColumn]) ?? null;
};

export const queryHandler = async (req: AuthenticatedRequest, res: Response) => {
  const payload = req.body as QueryPayload;
  if (!TABLES.has(payload.table)) return res.status(400).json({ data: null, error: { message: "Unknown table" } });
  const isAdmin = req.authUser ? await userIsAdmin(req.authUser.id) : false;
  if (!await canAccess(req, payload, isAdmin)) {
    return res.status(req.authUser ? 403 : 401).json({ data: null, error: { message: "Not authorized" } });
  }

  try {
    if (payload.operation === "select") {
      let rows = applyUserScope(req, payload, await readTable(payload.table), isAdmin);
      rows = rows.filter((row) => (payload.filters ?? []).every((filter) => matchesFilter(row, filter)));
      const count = rows.length;
      for (const order of [...(payload.orders ?? [])].reverse()) {
        rows.sort((left, right) => {
          const a = left[order.column];
          const b = right[order.column];
          const result = a == null ? 1 : b == null ? -1 : a < b ? -1 : a > b ? 1 : 0;
          return order.ascending === false ? -result : result;
        });
      }
      if (payload.range) rows = rows.slice(payload.range[0], payload.range[1] + 1);
      else if (payload.limit != null) rows = rows.slice(0, payload.limit);
      rows = await attachRelationships(payload.table, rows);
      return res.json({ data: payload.head ? null : rows, error: null, count });
    }

    if (payload.operation === "insert" || payload.operation === "upsert") {
      const inputRows = Array.isArray(payload.values) ? payload.values : [payload.values ?? {}];
      const result: Array<Record<string, unknown>> = [];
      for (const input of inputRows) {
        const now = new Date().toISOString();
        const scoped = scopeWriteInput(payload, input, req.authUser?.id, isAdmin);
        const existing = payload.operation === "upsert"
          ? await findUpsertRecord(payload.table, scoped, payload.onConflict)
          : null;
        const recordId = String(existing?.recordId ?? scoped.id ?? randomUUID());
        const previous = existing ? toRecordData(existing.data) : {};
        const data = jsonSafe({
          ...previous,
          ...scoped,
          id: recordId,
          created_at: previous.created_at ?? scoped.created_at ?? now,
          updated_at: scoped.updated_at ?? now,
        });
        await prisma.contentRecord.upsert({
          where: { key: `${payload.table}:${recordId}` },
          update: { data },
          create: { key: `${payload.table}:${recordId}`, tableName: payload.table, recordId, data },
        });
        result.push(data as Record<string, unknown>);
      }
      return res.json({ data: result, error: null, count: result.length });
    }

    const records = await prisma.contentRecord.findMany({ where: { tableName: payload.table } });
    const matches = records.filter(({ data }) => {
      const row = toRecordData(data);
      if (!isAdmin && USER_TABLES.has(payload.table)) {
        if (payload.table === "profiles" && row.id !== req.authUser?.id) return false;
        if (payload.table !== "profiles" && row.user_id !== req.authUser?.id) return false;
      }
      return (payload.filters ?? []).every((filter) => matchesFilter(row, filter));
    });

    if (payload.operation === "update") {
      const rawChanges = Array.isArray(payload.values) ? payload.values[0] : payload.values ?? {};
      const changes = scopeWriteInput(payload, rawChanges, req.authUser?.id, isAdmin);
      const updated: Array<Record<string, unknown>> = [];
      for (const record of matches) {
        const data = jsonSafe({ ...toRecordData(record.data), ...changes, updated_at: new Date().toISOString() });
        await prisma.contentRecord.update({ where: { key: record.key }, data: { data } });
        updated.push(data as Record<string, unknown>);
      }
      return res.json({ data: updated, error: null, count: updated.length });
    }

    await prisma.contentRecord.deleteMany({ where: { key: { in: matches.map((record) => record.key) } } });
    return res.json({ data: matches.map(({ data }) => toRecordData(data)), error: null, count: matches.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database query failed";
    return res.status(400).json({ data: null, error: { message } });
  }
};

export const exportAllTables = async () => {
  const records = await prisma.contentRecord.findMany({ orderBy: [{ tableName: "asc" }, { recordId: "asc" }] });
  const data: Record<string, Array<Record<string, unknown>>> = {};
  for (const record of records) {
    (data[record.tableName] ??= []).push(toRecordData(record.data));
  }
  return data;
};

export const importAllTables = async (tables: Record<string, Array<Record<string, unknown>>>) => {
  const results: Record<string, { inserted: number; errors: number }> = {};
  for (const [tableName, rows] of Object.entries(tables)) {
    if (!TABLES.has(tableName)) continue;
    results[tableName] = { inserted: 0, errors: 0 };
    for (const row of rows) {
      try {
        const recordId = String(row.id ?? randomUUID());
        const data = jsonSafe({ ...row, id: recordId });
        await prisma.contentRecord.upsert({
          where: { key: `${tableName}:${recordId}` },
          update: { data },
          create: { key: `${tableName}:${recordId}`, tableName, recordId, data },
        });
        results[tableName].inserted++;
      } catch {
        results[tableName].errors++;
      }
    }
  }
  return results;
};
