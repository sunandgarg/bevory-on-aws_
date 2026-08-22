import { describe, expect, it } from "vitest";
import { matchesFilter, queryAccessAllowed, scopeWriteInput, type QueryPayload } from "./data.js";

describe("query compatibility filters", () => {
  const row = {
    id: "product-1",
    name: "Johnnie Walker Blonde",
    price: 2499,
    tags: ["whisky", "scotch"],
    published: true,
  };

  it("matches equality and numeric comparisons", () => {
    expect(matchesFilter(row, { column: "id", operator: "eq", value: "product-1" })).toBe(true);
    expect(matchesFilter(row, { column: "price", operator: "gte", value: 2000 })).toBe(true);
  });

  it("matches case-insensitive wildcard searches", () => {
    expect(matchesFilter(row, { column: "name", operator: "ilike", value: "%walker%" })).toBe(true);
  });

  it("matches contained array values", () => {
    expect(matchesFilter(row, { column: "tags", operator: "contains", value: ["scotch"] })).toBe(true);
  });

  it("matches grouped OR conditions", () => {
    expect(matchesFilter(row, {
      operator: "or",
      filters: [
        { column: "id", operator: "eq", value: "other" },
        { column: "published", operator: "eq", value: true },
      ],
    })).toBe(true);
  });
});

describe("query authorization", () => {
  const payload = (overrides: Partial<QueryPayload>): QueryPayload => ({
    table: "products",
    operation: "select",
    ...overrides,
  });

  it("forces non-admin user writes into the authenticated user's scope", () => {
    const favorite = scopeWriteInput(
      payload({ table: "user_favorites", operation: "insert" }),
      { id: "victim-record", product_id: "product-1", user_id: "victim-user" },
      "actor-user",
      false,
    );
    expect(favorite).toMatchObject({ product_id: "product-1", user_id: "actor-user" });
    expect(favorite).not.toHaveProperty("id");

    const profile = scopeWriteInput(
      payload({ table: "profiles", operation: "upsert" }),
      { id: "victim-user", full_name: "Changed" },
      "actor-user",
      false,
    );
    expect(profile).toMatchObject({ id: "actor-user", full_name: "Changed" });
  });

  it("does not let anonymous or normal users mutate privileged records", () => {
    expect(queryAccessAllowed(payload({ table: "products", operation: "update" }), false, false)).toBe(false);
    expect(queryAccessAllowed(payload({ table: "user_roles", operation: "insert" }), true, false)).toBe(false);
    expect(queryAccessAllowed(payload({ table: "products", operation: "delete" }), true, false)).toBe(false);
    expect(queryAccessAllowed(payload({ table: "products", operation: "delete" }), true, true)).toBe(true);
  });

  it("allows safe public review inserts but rejects public upserts and deletes", () => {
    const publicInsert = payload({
      table: "product_reviews",
      operation: "insert",
      values: { product_id: "product-1", rating: 5, reviewer_name: "Guest" },
    });
    expect(queryAccessAllowed(publicInsert, false, false)).toBe(true);
    expect(queryAccessAllowed(payload({
      ...publicInsert,
      values: [
        { product_id: "product-1", rating: 5, reviewer_name: "Guest" },
        { product_id: "product-1", rating: 4, reviewer_name: "Other" },
      ],
    }), false, false)).toBe(false);
    expect(queryAccessAllowed(payload({ table: "product_reviews", operation: "upsert" }), false, false)).toBe(false);
    expect(queryAccessAllowed(payload({ table: "product_reviews", operation: "delete" }), false, false)).toBe(false);

    const review = scopeWriteInput(
      payload({ table: "product_reviews", operation: "insert" }),
      {
        product_id: "product-1",
        rating: 5,
        reviewer_name: "Guest",
        content: "Excellent",
      },
      undefined,
      false,
    );
    expect(review).toMatchObject({ is_approved: true, is_featured: false, is_reported: false });
    const forcedSafe = scopeWriteInput(
      payload({ table: "product_reviews", operation: "insert" }),
      { product_id: "product-1", rating: 5, reviewer_name: "Guest", is_featured: true },
      undefined,
      false,
    );
    expect(forcedSafe).toMatchObject({ is_featured: false, is_reported: false });
    expect(() => scopeWriteInput(
      payload({ table: "product_reviews", operation: "insert" }),
      { product_id: "product-1", rating: 5, reviewer_name: "Guest", role: "admin" },
      undefined,
      false,
    )).toThrow("Unsupported public review field");
  });

  it("only allows a tightly scoped public review report update", () => {
    const report = payload({
      table: "product_reviews",
      operation: "update",
      values: { is_reported: true, report_reason: "Spam" },
      filters: [{ column: "id", operator: "eq", value: "review-1" }],
    });
    expect(queryAccessAllowed(report, false, false)).toBe(true);
    expect(queryAccessAllowed(payload({
      ...report,
      values: { is_reported: false },
    }), false, false)).toBe(false);
    expect(queryAccessAllowed(payload({
      ...report,
      values: { is_reported: true, is_approved: false },
    }), false, false)).toBe(false);
    expect(queryAccessAllowed(payload({
      ...report,
      filters: [],
    }), false, false)).toBe(false);
  });
});
