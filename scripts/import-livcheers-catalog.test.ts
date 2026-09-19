import { describe, expect, it } from "vitest";
import {
  mergeUniqueNumbers,
  mergeUniqueStrings,
  normalizeIdentity,
  parseCategoryCards,
  parseCategorySlugs,
  pickProductEnrichment,
  resolveSourceCategorySlugs,
} from "./import-livcheers-catalog.js";

describe("Livcheers catalogue import helpers", () => {
  it("uses an auditable category override for blank Bangalore wine rows", () => {
    expect(resolveSourceCategorySlugs(
      "Le Grand",
      "Noir Syrah Wine",
      "",
      "BLR-R-263c8c9f1f835d88",
    )).toEqual(["red-wine"]);
  });

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
        price: null,
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

  it("extracts Faridabad cards", () => {
    const html = `
      <a href="/faridabad/liquor/sample-tequila-750ml">
        <h3>Sample Tequila</h3>
        <p>750 ML</p>
      </a>
    `;

    expect(parseCategoryCards(html, "faridabad", "tequila", "source")[0]?.productUrl)
      .toBe("https://www.livcheers.com/faridabad/liquor/sample-tequila-750ml");
  });

  it("extracts Bangalore cards", () => {
    const html = `
      <a href="/bangalore/liquor/sample-gin-750ml">
        <h3>Sample Gin</h3>
        <p>750 ML</p>
      </a>
    `;

    expect(parseCategoryCards(html, "bangalore", "gin", "source")[0]?.productUrl)
      .toBe("https://www.livcheers.com/bangalore/liquor/sample-gin-750ml");
  });

  it("accepts pipe and semicolon category delimiters", () => {
    expect(parseCategorySlugs("blended-scotch; made-in-india-whisky | blended-scotch"))
      .toEqual(["blended-scotch", "made-in-india-whisky"]);
    expect(parseCategorySlugs("")).toEqual([]);
  });

  it("merges additive product metadata without duplicates", () => {
    expect(mergeUniqueNumbers([750, 375], [1000, 750])).toEqual([1000, 750, 375]);
    expect(mergeUniqueStrings(["https://example.test/delhi"], [
      "https://example.test/faridabad",
      "https://example.test/delhi",
    ])).toEqual(["https://example.test/delhi", "https://example.test/faridabad"]);
  });

  it("parses package suffixes and card prices", () => {
    const html = `
      <a href="/delhi/liquor/wild-drum-pure-hard-seltzer-330ml-can">
        <img src="https://static.livcheers.com/seltzer.webp" alt="Wild Drum Pure Hard Seltzer" />
        <p class="text-[#007CF5]">Wild Drum</p>
        <h3>Wild Drum Pure Hard Seltzer</h3>
        <p>330ML CAN</p>
        <span>₹160</span>
        <span class="bg-[#F4F5F5]">Flavored</span>
      </a>
    `;

    expect(parseCategoryCards(html, "delhi", "ready-to-drink", "source")[0]).toMatchObject({
      volumeMl: 330,
      price: 160,
    });
  });

  it("matches a product when Livcheers splits its brand differently", () => {
    const source = {
      brand_name: "Sake Jpn",
      product_name: "Sake Shotoku Junmai Nigorizake",
      site_product_name: "Sake Jpn Sake Shotoku Junmai Nigorizake",
      variant_name: "720 ml",
      volume_ml: "720",
      price_inr: "4500",
      currency: "INR",
      city: "Gurgaon",
      source_category: "sake",
      source_url: "https://www.livcheers.com/gurgaon/category/sake",
      price_evidence: "category_card",
      source_accessed_on: "2026-09-19",
      source: { city: "Gurgaon", citySlug: "gurgaon" as const, path: "source.csv" },
      sourceIndex: 0,
      price: 4500,
      volumeMl: 720,
      categorySlugs: ["sake"],
      productKey: "sakejpn|sakeshotoku",
      brandKey: "sakejpn",
      variantKey: "sakejpn|sakeshotoku|720",
    };
    const enrichment = {
      citySlug: "gurgaon" as const,
      categorySlug: "sake",
      brandName: "Sake",
      productName: "Jpn Sake Shotoku Junmai Nigorizake",
      volumeMl: 720,
      typeName: "Sake",
      imageUrl: "https://static.livcheers.com/shotoku.webp",
      price: 4500,
      productUrl: "https://www.livcheers.com/gurgaon/liquor/shotoku-720ml",
      sourcePage: "source",
    };

    expect(pickProductEnrichment([source], [enrichment])).toEqual([enrichment]);
  });
});
