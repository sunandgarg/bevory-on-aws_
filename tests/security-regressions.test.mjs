import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("service worker never caches Supabase REST responses", async () => {
  const source = await read("public/sw.js");
  assert.match(source, /Never cache Supabase REST responses/);
  assert.doesNotMatch(source, /networkFirstWithCache\(request, API_CACHE/);
});

test("privileged edge functions require an administrator", async () => {
  const functions = [
    "export-database",
    "scrape-prices",
    "bulk-seed-products",
    "seed-trending-content",
    "ai-recommend",
  ];

  for (const functionName of functions) {
    const source = await read(`supabase/functions/${functionName}/index.ts`);
    assert.match(source, /requireAdmin\(req\)/, `${functionName} must call requireAdmin`);
  }
});

test("security migration removes public secret and profile policies", async () => {
  const source = await read(
    "supabase/migrations/20260721153000_secure_settings_profiles_and_admin_functions.sql",
  );
  assert.match(source, /DROP POLICY IF EXISTS "App settings are publicly readable"/);
  assert.match(source, /DROP POLICY IF EXISTS "Anyone can view basic public profile info via view"/);
  assert.match(source, /- 'openai_api_key'/);
  assert.match(source, /- 'serviceAccountJson'/);
});
