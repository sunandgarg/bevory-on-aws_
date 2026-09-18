import { describe, expect, it } from "vitest";
import { BEVORY_CITIES, CITIES_BY_STATE, CITY_SLUGS, cityFromSlug } from "./locations";

describe("Bevory city catalogue", () => {
  it("contains all 30 unique launch cities", () => {
    expect(BEVORY_CITIES).toHaveLength(30);
    expect(new Set(BEVORY_CITIES.map(({ name }) => name)).size).toBe(30);
    expect(new Set(CITY_SLUGS).size).toBe(30);
  });

  it("keeps route names and state groups aligned", () => {
    expect(cityFromSlug("hubli-dharwad")?.name).toBe("Hubli Dharwad");
    expect(CITIES_BY_STATE.Maharashtra).toEqual(["Mumbai", "Nagpur", "Nashik", "Pune", "Thane"]);
  });
});

