import { describe, expect, it } from "vitest";
import { normalizeIdentity, parseCategoryCards } from "./import-livcheers-catalog.js";

describe("Livcheers catalogue import helpers", () => {
  it("normalizes punctuation and spacing for stable deduplication", () => {
    expect(normalizeIdentity("Teacher's  Highland-Cream")).toBe("teachershighlandcream");
    expect(normalizeIdentity("A & B")).toBe("aandb");
  });

  it("extracts a verified product card with type and volume", () => {
    const html = `
      <a class="card" href="/delhi/liquor/sample-whisky-750ml">
        <img src="https://static.livcheers.com/static/content/images/product/SAMPLE.webp" alt="Sample Whisky" />
        <p class="text-[#007CF5]">Sample Brand</p>
        <h3>Sample Whisky</h3>
        <span class="bg-[#F4F5F5]">Blended Whisky</span>
        <p>750 ML</p>
      </a>
    `;

    expect(parseCategoryCards(html, "delhi", "blended-scotch", "https://example.test/category")).toEqual([
      {
        citySlug: "delhi",
        categorySlug: "blended-scotch",
        brandName: "Sample Brand",
        productName: "Sample Whisky",
        volumeMl: 750,
        typeName: "Blended Whisky",
        imageUrl: "https://static.livcheers.com/static/content/images/product/SAMPLE.webp",
        productUrl: "https://www.livcheers.com/delhi/liquor/sample-whisky-750ml",
        sourcePage: "https://example.test/category",
      },
    ]);
  });

  it("converts litre values to millilitres", () => {
    const html = `
      <a href="/goa/liquor/sample-rum-1l">
        <h3>Sample Rum</h3>
        <p>1 L</p>
      </a>
    `;

    expect(parseCategoryCards(html, "goa", "rum", "https://example.test/rum")[0]?.volumeMl).toBe(1000);
  });
});
