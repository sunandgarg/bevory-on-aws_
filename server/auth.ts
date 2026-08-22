import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma, toRecordData } from "./db.js";

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  user_metadata: Record<string, unknown>;
  created_at: string;
};

export type AuthenticatedRequest = Request & { authUser?: AuthUser };

const jwtSecret = () => process.env.JWT_SECRET || "bevory-local-development-only";

const serializeUser = (user: {
  id: string;
  email: string | null;
  phone: string | null;
  metadata: unknown;
  createdAt: Date;
}): AuthUser => ({
  id: user.id,
  email: user.email,
  phone: user.phone,
  user_metadata: toRecordData(user.metadata),
  created_at: user.createdAt.toISOString(),
});

const upsertProfile = async (user: AuthUser) => {
  const now = new Date().toISOString();
  const existing = await prisma.contentRecord.findUnique({ where: { key: `profiles:${user.id}` } });
  const previous = existing ? toRecordData(existing.data) : {};
  const fullName = user.user_metadata.full_name ?? user.user_metadata.name ?? previous.full_name ?? null;
  const data = {
    ...previous,
    id: user.id,
    email: user.email,
    phone: user.phone,
    full_name: fullName,
    created_at: previous.created_at ?? now,
    updated_at: now,
  } as Prisma.InputJsonObject;
  await prisma.contentRecord.upsert({
    where: { key: `profiles:${user.id}` },
    update: { data },
    create: {
      key: `profiles:${user.id}`,
      tableName: "profiles",
      recordId: user.id,
      data,
    },
  });
};

export const createSession = (user: AuthUser) => ({
  access_token: jwt.sign({ sub: user.id }, jwtSecret(), { expiresIn: "7d" }),
  token_type: "bearer",
  expires_in: 604800,
  expires_at: Math.floor(Date.now() / 1000) + 604800,
  refresh_token: "",
  user,
});

export const optionalAuth = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const payload = jwt.verify(header.slice(7), jwtSecret()) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user) req.authUser = serializeUser(user);
  } catch {
    // An invalid/expired token is treated as an anonymous request.
  }
  next();
};

export const requireUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.authUser) return res.status(401).json({ error: { message: "Authentication required" } });
  next();
};

export const userIsAdmin = async (userId: string) => {
  const roles = await prisma.contentRecord.findMany({ where: { tableName: "user_roles" } });
  return roles.some(({ data }) => {
    const role = toRecordData(data);
    return role.user_id === userId && role.role === "admin";
  });
};

export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.authUser) return res.status(401).json({ error: { message: "Authentication required" } });
  if (!await userIsAdmin(req.authUser.id)) {
    return res.status(403).json({ error: { message: "Administrator access required" } });
  }
  next();
};

export const signUp = async (input: {
  email?: string;
  phone?: string;
  password?: string;
  data?: Record<string, unknown>;
}) => {
  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone?.trim() || null;
  if (!email && !phone) throw new Error("Email or phone is required");
  if (input.password && input.password.length < 8) throw new Error("Password must be at least 8 characters");

  const duplicate = email
    ? await prisma.user.findUnique({ where: { email } })
    : await prisma.user.findUnique({ where: { phone: phone! } });
  if (duplicate) throw new Error("A user with this email or phone already exists");

  const id = randomUUID();
  const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : null;
  const user = await prisma.user.create({
    data: {
      id,
      email,
      phone,
      passwordHash,
      metadata: (input.data ?? {}) as Prisma.InputJsonObject,
    },
  });
  const serialized = serializeUser(user);
  await upsertProfile(serialized);
  return serialized;
};

export const signIn = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user?.passwordHash || !await bcrypt.compare(password, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }
  return serializeUser(user);
};

export const getUserFromToken = async (token: string) => {
  const payload = jwt.verify(token, jwtSecret()) as { sub: string };
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  return user ? serializeUser(user) : null;
};

export const createOAuthState = (redirectTo: string) =>
  jwt.sign({ purpose: "google-oauth", redirectTo }, jwtSecret(), { expiresIn: "10m" });

export const verifyOAuthState = (state: string) => {
  const payload = jwt.verify(state, jwtSecret()) as { purpose?: string; redirectTo?: string };
  if (payload.purpose !== "google-oauth" || !payload.redirectTo) throw new Error("Invalid OAuth state");
  return payload.redirectTo;
};

export const findOrCreateExternalUser = async (profile: {
  email: string;
  fullName?: string;
  avatarUrl?: string;
  provider: "google";
  providerId: string;
}) => {
  const email = profile.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  const previousMetadata = existing ? toRecordData(existing.metadata) : {};
  const metadata = JSON.parse(JSON.stringify({
    ...previousMetadata,
    full_name: profile.fullName ?? previousMetadata.full_name,
    avatar_url: profile.avatarUrl ?? previousMetadata.avatar_url,
    provider: profile.provider,
    provider_id: profile.providerId,
  })) as Prisma.InputJsonObject;
  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { metadata } })
    : await prisma.user.create({ data: { id: randomUUID(), email, metadata } });
  const serialized = serializeUser(user);
  await upsertProfile(serialized);
  return serialized;
};

export const findOrCreatePhoneUser = async (phone: string) => {
  const normalized = phone.trim();
  const existing = await prisma.user.findUnique({ where: { phone: normalized } });
  const user = existing ?? await prisma.user.create({
    data: { id: randomUUID(), phone: normalized, metadata: { provider: "phone" } },
  });
  const serialized = serializeUser(user);
  await upsertProfile(serialized);
  return serialized;
};
