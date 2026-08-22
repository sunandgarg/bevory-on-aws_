import { PrismaClient } from "@prisma/client";

declare global {
  var __bevoryPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.__bevoryPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__bevoryPrisma = prisma;
}

export const toRecordData = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
