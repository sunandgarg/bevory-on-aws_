import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const PUBLIC_TABLES = [
  "announcements",
  "app_settings",
  "blog_posts",
  "brand_spotlights",
  "categories",
  "cheers_guides",
  "cities",
  "cocktails",
  "countries",
  "help_support_items",
  "party_recommendations",
  "product_prices",
  "product_reviews",
  "products",
  "spiritz_magazine",
  "states",
  "sub_categories",
  "video_categories",
  "video_creators",
  "video_reviews",
];

const parseEnv = (source) => Object.fromEntries(
  source
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      return [line.slice(0, separator), value];
    }),
);

const redactSecrets = (value) => {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !/(secret|token|password|credential|service.?account|api.?key)/i.test(key))
      .map(([key, nested]) => [key, redactSecrets(nested)]),
  );
};

const env = parseEnv(await readFile(".env", "utf8"));
const sourceUrl = env.VITE_SUPABASE_URL;
const publicKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!sourceUrl || !publicKey) {
  throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required in .env");
}

const exported = {};

for (const table of PUBLIC_TABLES) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${sourceUrl}/rest/v1/${table}?select=*&offset=${offset}&limit=1000`, {
      headers: { apikey: publicKey },
    });
    if (!response.ok) {
      throw new Error(`${table}: ${response.status} ${await response.text()}`);
    }
    const page = await response.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }

  exported[table] = table === "app_settings" ? rows.map(redactSecrets) : rows;
  console.log(`${table}: ${rows.length}`);
}

const payload = {
  exportedAt: new Date().toISOString(),
  source: "bevoryin Supabase public API",
  privacy: "Only anonymously readable content tables; credential-like setting fields removed.",
  tables: exported,
};

await mkdir(path.join("prisma"), { recursive: true });
await writeFile(path.join("prisma", "seed-data.json"), `${JSON.stringify(payload, null, 2)}\n`);
console.log("Wrote prisma/seed-data.json");
