import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

type StarterRow = {
  tableName: string;
  recordId: string;
  data: Prisma.InputJsonObject;
};

const createdAt = new Date().toISOString();
const countryId = "starter-country-india";
const stateId = "starter-state-haryana";
const cityId = "starter-city-gurgaon";

const starterRows: StarterRow[] = [
  {
    tableName: "countries",
    recordId: countryId,
    data: { id: countryId, name: "India", code: "IN", created_at: createdAt },
  },
  {
    tableName: "states",
    recordId: stateId,
    data: {
      id: stateId,
      country_id: countryId,
      name: "Haryana",
      code: "HR",
      is_visible: true,
      is_popular: true,
      created_at: createdAt,
    },
  },
  {
    tableName: "cities",
    recordId: cityId,
    data: {
      id: cityId,
      state_id: stateId,
      name: "Gurgaon",
      slug: "gurgaon",
      is_visible: true,
      is_popular: true,
      created_at: createdAt,
    },
  },
  ...[
    ["beer", "Beer", "🍺"],
    ["whisky", "Whisky", "🥃"],
    ["wine", "Wine", "🍷"],
    ["vodka", "Vodka", "🍸"],
    ["gin", "Gin", "🌿"],
    ["rum", "Rum", "🏴‍☠️"],
  ].map(([slug, name, emoji], orderIndex) => ({
    tableName: "categories",
    recordId: `starter-category-${slug}`,
    data: {
      id: `starter-category-${slug}`,
      name,
      slug,
      emoji,
      order_index: orderIndex,
      is_active: true,
      is_trending: false,
      created_at: createdAt,
    },
  })),
];

for (const row of starterRows) {
  await prisma.contentRecord.upsert({
    where: { key: `${row.tableName}:${row.recordId}` },
    update: { data: row.data },
    create: {
      key: `${row.tableName}:${row.recordId}`,
      tableName: row.tableName,
      recordId: row.recordId,
      data: row.data,
    },
  });
}
console.log(`Seeded ${starterRows.length} clean starter records`);

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
