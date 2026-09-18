import { writeFile } from "node:fs/promises";
import { BEVORY_CITIES } from "../src/lib/locations.js";

const origin = "https://bevory.in";
const lastModified = new Date().toISOString().slice(0, 10);
const staticPages = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/categories", changefreq: "weekly", priority: "0.9" },
  ...["beer", "whisky", "wine", "vodka", "gin", "rum"].map((category) => ({
    path: `/category/${category}`,
    changefreq: "weekly",
    priority: "0.8",
  })),
  { path: "/party-planner", changefreq: "weekly", priority: "0.8" },
  { path: "/cocktails", changefreq: "weekly", priority: "0.7" },
  { path: "/guide", changefreq: "weekly", priority: "0.7" },
  { path: "/brands", changefreq: "weekly", priority: "0.7" },
  { path: "/help", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/disclaimer", changefreq: "yearly", priority: "0.3" },
];

const cityPages = BEVORY_CITIES.map(({ slug }) => ({
  path: `/${slug}`,
  changefreq: "daily",
  priority: "0.9",
}));

const urls = [...staticPages, ...cityPages].map(({ path, changefreq, priority }) => `  <url>
    <loc>${origin}${path}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join("\n");

await writeFile(
  new URL("../public/sitemap.xml", import.meta.url),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);

console.log(`Generated sitemap with ${staticPages.length + cityPages.length} URLs`);

