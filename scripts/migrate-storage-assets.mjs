import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const seedPath = path.join("prisma", "seed-data.json");
const assetsDir = path.join("public", "migrated-assets");
const seed = JSON.parse(await readFile(seedPath, "utf8"));
const replacements = new Map();

const collect = (value) => {
  if (typeof value === "string" && /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\//.test(value)) {
    replacements.set(value, "");
  } else if (Array.isArray(value)) {
    value.forEach(collect);
  } else if (value && typeof value === "object") {
    Object.values(value).forEach(collect);
  }
};

collect(seed);
await mkdir(assetsDir, { recursive: true });

for (const sourceUrl of replacements.keys()) {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`${sourceUrl}: ${response.status}`);
  const pathname = new URL(sourceUrl).pathname;
  const originalName = decodeURIComponent(path.basename(pathname)).replace(/[^a-zA-Z0-9._-]/g, "-");
  const digest = createHash("sha256").update(sourceUrl).digest("hex").slice(0, 10);
  const filename = `${digest}-${originalName}`;
  await writeFile(path.join(assetsDir, filename), Buffer.from(await response.arrayBuffer()));
  replacements.set(sourceUrl, `/migrated-assets/${filename}`);
  console.log(`${sourceUrl} -> /migrated-assets/${filename}`);
}

const replace = (value) => {
  if (typeof value === "string") return replacements.get(value) || value;
  if (Array.isArray(value)) return value.map(replace);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, replace(nested)]));
  }
  return value;
};

await writeFile(seedPath, `${JSON.stringify(replace(seed), null, 2)}\n`);
console.log(`Migrated ${replacements.size} public storage assets.`);
