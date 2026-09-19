import { describe, expect, it } from "vitest";
import { buildCityCatalog } from "./catalog.js";

describe("buildCityCatalog", () => {
  it("returns only active products with approved city prices", () => {
    const result = buildCityCatalog(
      [
        { product_id: "p1", price: 900, volume: "750ml", volume_ml: 750, price_available: true },
        { product_id: "p1", price: 460, volume: "375ml", volume_ml: 375, price_available: true },
        { product_id: "p2", price: 10, volume: "750ml", volume_ml: 750, price_available: true, requires_review: true },
      ],
      [
        { id: "p1", brand: "Antiquity", name: "Blue", category_id: "c1", sub_category_id: "s1", is_active: true },
        { id: "p2", brand: "Review", name: "Pending", category_id: "c1", is_active: true },
      ],
      [{ id: "c1", name: "Whisky", slug: "whisky", emoji: null, is_active: true, order_index: 1 }],
      [{ id: "s1", name: "Blended", slug: "blended", emoji: null, is_active: true }],
    );

    expect(result.totalProducts).toBe(1);
    expect(result.products[0]).toMatchObject({
      id: "p1",
      price: 900,
      volume: "750ml",
      category: { slug: "whisky" },
      sub_category: { slug: "blended" },
    });
    expect(result.products[0].available_variants).toHaveLength(2);
  });
});
