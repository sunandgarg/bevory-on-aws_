import { describe, expect, it } from "vitest";
import { parseFilterScalar } from "./filterParser";

describe("OR filter scalar parsing", () => {
  it("parses boolean and null literals", () => {
    expect(parseFilterScalar("true")).toBe(true);
    expect(parseFilterScalar("FALSE")).toBe(false);
    expect(parseFilterScalar("null")).toBeNull();
  });

  it("parses finite numeric literals", () => {
    expect(parseFilterScalar("42")).toBe(42);
    expect(parseFilterScalar("-12.5")).toBe(-12.5);
    expect(parseFilterScalar("1e3")).toBe(1000);
  });

  it("preserves identifiers and wildcard search values as strings", () => {
    expect(parseFilterScalar("starter-category-beer")).toBe("starter-category-beer");
    expect(parseFilterScalar("001")).toBe("001");
    expect(parseFilterScalar("%walker%")).toBe("%walker%");
  });
});
