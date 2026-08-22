import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

const prisma = new PrismaClient();
const sourcePath = process.argv.find((value) => !value.startsWith("-") && value !== process.argv[0] && value !== process.argv[1]);
const apply = process.argv.includes("--apply");

if (!sourcePath) {
  throw new Error("Usage: pnpm data:import-private -- path/to/private-export.json [--apply]");
}

const source = JSON.parse(await readFile(sourcePath, "utf8"));
const users = Array.isArray(source.users) ? source.users : Array.isArray(source.auth?.users) ? source.auth.users : [];
const tables = source.tables && typeof source.tables === "object" ? source.tables : {};
const userTables = new Set([
  "comparisons", "notifications", "preferred_brands", "profiles", "recent_searches",
  "saved_locations", "user_favorites", "user_permissions", "user_preferences", "user_roles",
]);

const summary = {
  users: users.length,
  supportedPasswordHashes: users.filter((user) => {
    const hash = user.password_hash || user.encrypted_password;
    return typeof hash === "string" && /^\$2[aby]\$/.test(hash);
  }).length,
  passwordResetsRequired: users.filter((user) => {
    const hash = user.password_hash || user.encrypted_password;
    return typeof hash !== "string" || !/^\$2[aby]\$/.test(hash);
  }).length,
  tableRows: Object.fromEntries(Object.entries(tables)
    .filter(([name, rows]) => userTables.has(name) && Array.isArray(rows))
    .map(([name, rows]) => [name, rows.length])),
};

if (!apply) {
  console.log(JSON.stringify({ mode: "dry-run", ...summary }, null, 2));
  console.log("No data changed. Re-run with --apply after reviewing the counts.");
  await prisma.$disconnect();
  process.exit(0);
}

const idMap = new Map();
for (const input of users) {
  const oldId = String(input.id || randomUUID());
  const email = input.email ? String(input.email).trim().toLowerCase() : null;
  const phone = input.phone ? String(input.phone).trim() : null;
  const suppliedHash = input.password_hash || input.encrypted_password;
  const passwordHash = typeof suppliedHash === "string" && /^\$2[aby]\$/.test(suppliedHash) ? suppliedHash : null;
  const existing = email
    ? await prisma.user.findUnique({ where: { email } })
    : phone ? await prisma.user.findUnique({ where: { phone } }) : null;
  const id = existing?.id || oldId;
  idMap.set(oldId, id);
  const sourceMetadata = input.raw_user_meta_data || input.user_metadata || input.metadata || {};
  const metadata = {
    ...(sourceMetadata && typeof sourceMetadata === "object" ? sourceMetadata : {}),
    migrated_from_supabase: true,
    password_reset_required: !passwordHash,
  };
  if (existing) {
    await prisma.user.update({
      where: { id },
      data: { email: email || existing.email, phone: phone || existing.phone, passwordHash: passwordHash || existing.passwordHash, metadata },
    });
  } else {
    await prisma.user.create({ data: { id, email, phone, passwordHash, metadata } });
  }
}

for (const [tableName, rows] of Object.entries(tables)) {
  if (!userTables.has(tableName) || !Array.isArray(rows)) continue;
  for (const input of rows) {
    if (!input || typeof input !== "object") continue;
    const row = { ...input };
    if (row.user_id && idMap.has(String(row.user_id))) row.user_id = idMap.get(String(row.user_id));
    if (tableName === "profiles" && row.id && idMap.has(String(row.id))) row.id = idMap.get(String(row.id));
    const recordId = String(row.id || randomUUID());
    row.id = recordId;
    await prisma.contentRecord.upsert({
      where: { key: `${tableName}:${recordId}` },
      update: { data: row },
      create: {
        key: `${tableName}:${recordId}`,
        tableName,
        recordId,
        data: row,
      },
    });
  }
}

console.log(JSON.stringify({ mode: "applied", ...summary }, null, 2));
await prisma.$disconnect();
