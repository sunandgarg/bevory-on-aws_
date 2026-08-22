import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

const prisma = new PrismaClient();

type SeedFile = {
  tables: Record<string, Array<Record<string, unknown>>>;
};

const seed = JSON.parse(await readFile(new URL("./seed-data.json", import.meta.url), "utf8")) as SeedFile;

for (const [tableName, rows] of Object.entries(seed.tables)) {
  for (const row of rows) {
    const recordId = String(row.id ?? randomUUID());
    const data = { ...row, id: recordId } as Prisma.InputJsonObject;
    await prisma.contentRecord.upsert({
      where: { key: `${tableName}:${recordId}` },
      update: { data },
      create: { key: `${tableName}:${recordId}`, tableName, recordId, data },
    });
  }
  console.log(`Seeded ${tableName}: ${rows.length}`);
}

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
