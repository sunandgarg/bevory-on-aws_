import { describe, expect, it } from "vitest";
import { matchesFilter } from "./data.js";

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
