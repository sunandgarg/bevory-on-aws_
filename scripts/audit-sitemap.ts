import { readFile } from "node:fs/promises";
import { CITY_SLUGS } from "../src/lib/locations.js";

const concurrency = Math.max(1, Number(process.env.SITEMAP_AUDIT_CONCURRENCY) || 24);
const auditOrigin = process.env.SITEMAP_AUDIT_ORIGIN?.replace(/\/$/, "");
const sitemapPath = new URL("../public/sitemap.xml", import.meta.url);

const decodeXml = (value: string) => value
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'");

const sitemap = await readFile(sitemapPath, "utf8");
const canonicalUrls = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)]
  .map((match) => decodeXml(match[1]));

if (!canonicalUrls.length) throw new Error("Sitemap contains no page URLs");
if (new Set(canonicalUrls).size !== canonicalUrls.length) {
  throw new Error("Sitemap contains duplicate page URLs");
}

const legacySegments = ["/haryana/", "/karnataka/", "/india/"];
for (const value of canonicalUrls) {
  const url = new URL(value);
  if (url.origin !== "https://bevory.in") throw new Error(`Non-canonical origin in sitemap: ${value}`);
  if (url.search || url.hash) throw new Error(`Query or fragment URL in sitemap: ${value}`);
  if (legacySegments.some((segment) => url.pathname.includes(segment))) {
    throw new Error(`Legacy state URL in sitemap: ${value}`);
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (["product", "brand", "category"].includes(parts[0])) {
    throw new Error(`Non-city catalogue URL in sitemap: ${value}`);
  }
  if (["product", "brand", "category"].includes(parts[1]) && !CITY_SLUGS.includes(parts[0])) {
    throw new Error(`Unknown city catalogue URL in sitemap: ${value}`);
  }
}

type AuditFailure = { url: string; reason: string };
const failures: AuditFailure[] = [];
let cursor = 0;
let completed = 0;

const auditUrl = async (canonicalUrl: string) => {
  const canonical = new URL(canonicalUrl);
  const requestUrl = auditOrigin
    ? `${auditOrigin}${canonical.pathname}${canonical.search}`
    : canonicalUrl;
  const response = await fetch(requestUrl, {
    headers: {
      accept: "text/html",
      "user-agent": "Bevory-Sitemap-Audit/1.0",
    },
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  });

  if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const canonicalHref = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)/i)?.[1];
  if (canonicalHref !== canonicalUrl) {
    throw new Error(`canonical is ${canonicalHref || "missing"}`);
  }

  const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)/i)?.[1];
  const robotsDirectives = robots?.toLowerCase().split(",").map((value) => value.trim()) ?? [];
  if (!robotsDirectives.includes("index") || robotsDirectives.includes("noindex")) {
    throw new Error(`robots is ${robots || "missing"}`);
  }
  if (!/<h1(?:\s|>)/i.test(html)) throw new Error("H1 is missing from initial HTML");
  if (!/<title>[^<]+<\/title>/i.test(html)) throw new Error("title is missing");
  if (!/<meta\s+name=["']description["']\s+content=["'][^"']+/i.test(html)) {
    throw new Error("meta description is missing");
  }

  const jsonLd = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (!jsonLd.length) throw new Error("JSON-LD is missing");
  const schemaTypes = new Set<string>();
  for (const block of jsonLd) {
    const parsed = JSON.parse(block[1]) as Record<string, unknown>;
    const nodes = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
    for (const node of nodes) {
      if (node && typeof node === "object" && typeof (node as Record<string, unknown>)["@type"] === "string") {
        schemaTypes.add((node as Record<string, string>)["@type"]);
      }
    }
  }

  const parts = canonical.pathname.split("/").filter(Boolean);
  if (parts[1] === "product") {
    const expectedType = parts.length === 4 ? "Product" : "ProductGroup";
    if (!schemaTypes.has(expectedType)) throw new Error(`${expectedType} schema is missing`);
  }
  if (parts[0] === "guide" && parts[1] && !schemaTypes.has("Article")) {
    throw new Error("Article schema is missing");
  }
  if (parts[0] === "cocktail" && parts[1] && !schemaTypes.has("Recipe")) {
    throw new Error("Recipe schema is missing");
  }
};

const worker = async () => {
  while (cursor < canonicalUrls.length) {
    const index = cursor++;
    const url = canonicalUrls[index];
    try {
      await auditUrl(url);
    } catch (error) {
      failures.push({
        url,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
    completed += 1;
    if (completed % 500 === 0 || completed === canonicalUrls.length) {
      console.log(`Audited ${completed}/${canonicalUrls.length} sitemap pages`);
    }
  }
};

await Promise.all(Array.from(
  { length: Math.min(concurrency, canonicalUrls.length) },
  () => worker(),
));

if (failures.length) {
  console.error(JSON.stringify(failures.slice(0, 50), null, 2));
  throw new Error(`${failures.length} sitemap page${failures.length === 1 ? "" : "s"} failed audit`);
}

console.log(`All ${canonicalUrls.length} sitemap pages passed`);
