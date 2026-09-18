import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { BEVORY_CITIES } from "../src/lib/locations.js";

const prisma = new PrismaClient();

const createdAt = new Date().toISOString();
const recordData = (value: Prisma.JsonValue) => (
  value && typeof value === "object" && !Array.isArray(value) ? value as Prisma.JsonObject : {}
);
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const sameSlug = (left: unknown, right: string) => slugify(String(left ?? "")) === slugify(right);

const upsertContentRecord = async (tableName: string, recordId: string, data: Prisma.InputJsonObject) => {
  await prisma.contentRecord.upsert({
    where: { key: `${tableName}:${recordId}` },
    update: { data },
    create: {
      key: `${tableName}:${recordId}`,
      tableName,
      recordId,
      data,
    },
  });
};

const existingCountries = await prisma.contentRecord.findMany({ where: { tableName: "countries" } });
const indiaRecord = existingCountries.find(({ data }) => recordData(data).code === "IN");
const countryId = indiaRecord?.recordId ?? "starter-country-india";
const indiaData = recordData(indiaRecord?.data ?? {});
await upsertContentRecord("countries", countryId, {
  ...indiaData,
  id: countryId,
  name: "India",
  code: "IN",
  created_at: indiaData.created_at ?? createdAt,
  updated_at: createdAt,
});

const existingStates = await prisma.contentRecord.findMany({ where: { tableName: "states" } });
const stateIds = new Map<string, string>();
const stateDefinitions = [...new Map(BEVORY_CITIES.map(({ state, stateCode }) => [
  stateCode,
  { name: state, code: stateCode },
])).values()];

for (const state of stateDefinitions) {
  const existing = existingStates.find(({ data }) => {
    const value = recordData(data);
    return value.code === state.code || sameSlug(value.name, state.name);
  });
  const recordId = existing?.recordId ?? `bevory-state-${slugify(state.name)}`;
  const previous = recordData(existing?.data ?? {});
  await upsertContentRecord("states", recordId, {
    ...previous,
    id: recordId,
    country_id: countryId,
    name: state.name,
    code: state.code,
    is_visible: true,
    is_popular: BEVORY_CITIES.some((city) => city.stateCode === state.code && city.popular),
    created_at: previous.created_at ?? createdAt,
    updated_at: createdAt,
  });
  stateIds.set(state.code, recordId);
}

const existingCities = await prisma.contentRecord.findMany({ where: { tableName: "cities" } });
for (const city of BEVORY_CITIES) {
  const existing = existingCities.find(({ data }) => {
    const value = recordData(data);
    return sameSlug(value.slug, city.slug) || sameSlug(value.name, city.name);
  });
  const recordId = existing?.recordId ?? (city.slug === "gurgaon" ? "starter-city-gurgaon" : `bevory-city-${city.slug}`);
  const previous = recordData(existing?.data ?? {});
  await upsertContentRecord("cities", recordId, {
    ...previous,
    id: recordId,
    state_id: stateIds.get(city.stateCode)!,
    name: city.name,
    slug: city.slug,
    is_visible: true,
    is_popular: Boolean(city.popular),
    created_at: previous.created_at ?? createdAt,
    updated_at: createdAt,
  });
}

const existingCategories = await prisma.contentRecord.findMany({ where: { tableName: "categories" } });
const categoryDefinitions = [
  ["beer", "Beer", "🍺"],
  ["whisky", "Whisky", "🥃"],
  ["wine", "Wine", "🍷"],
  ["vodka", "Vodka", "🍸"],
  ["gin", "Gin", "🌿"],
  ["rum", "Rum", "🏴‍☠️"],
] as const;

for (const [orderIndex, [slug, name, emoji]] of categoryDefinitions.entries()) {
  const existing = existingCategories.find(({ data }) => recordData(data).slug === slug);
  const recordId = existing?.recordId ?? `starter-category-${slug}`;
  const previous = recordData(existing?.data ?? {});
  await upsertContentRecord("categories", recordId, {
    ...previous,
    id: recordId,
    name,
    slug,
    emoji,
    order_index: previous.order_index ?? orderIndex,
    is_active: previous.is_active ?? true,
    is_trending: previous.is_trending ?? false,
    created_at: previous.created_at ?? createdAt,
    updated_at: createdAt,
  });
}

console.log(`Seeded India, ${stateDefinitions.length} states, ${BEVORY_CITIES.length} cities, and ${categoryDefinitions.length} categories`);

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;

if (adminEmail && adminPassword) {
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  const id = existing?.id ?? randomUUID();
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, metadata: { full_name: "Bevory Administrator" } },
    create: { id, email: adminEmail, passwordHash, metadata: { full_name: "Bevory Administrator" } },
  });

  const now = new Date().toISOString();
  await prisma.contentRecord.upsert({
    where: { key: `profiles:${id}` },
    update: { data: { id, email: adminEmail, full_name: "Bevory Administrator", updated_at: now } },
    create: {
      key: `profiles:${id}`,
      tableName: "profiles",
      recordId: id,
      data: { id, email: adminEmail, full_name: "Bevory Administrator", created_at: now, updated_at: now },
    },
  });
  await prisma.contentRecord.upsert({
    where: { key: `user_roles:${id}-admin` },
    update: { data: { id: `${id}-admin`, user_id: id, role: "admin", created_at: now } },
    create: {
      key: `user_roles:${id}-admin`,
      tableName: "user_roles",
      recordId: `${id}-admin`,
      data: { id: `${id}-admin`, user_id: id, role: "admin", created_at: now },
    },
  });
  console.log(`Seeded local administrator: ${adminEmail}`);
}

await prisma.$disconnect();
