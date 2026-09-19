import { readFile } from "node:fs/promises";

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

  const jsonLd = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (!jsonLd.length) throw new Error("JSON-LD is missing");
  for (const block of jsonLd) JSON.parse(block[1]);
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
