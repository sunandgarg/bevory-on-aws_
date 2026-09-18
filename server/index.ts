import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import {
  createOAuthState,
  createSession,
  findOrCreateExternalUser,
  findOrCreatePhoneUser,
  getUserFromToken,
  optionalAuth,
  signIn,
  signUp,
  userIsAdmin,
  verifyOAuthState,
  type AuthenticatedRequest,
} from "./auth.js";
import { queryHandler } from "./data.js";
import { functionsHandler } from "./functions.js";
import { prisma } from "./db.js";
import {
  buildGoogleAuthorizationUrl,
  exchangeGoogleCode,
  googleOAuthConfigured,
  googleRedirectUri,
} from "./integrations/googleOAuth.js";
import { phoneOtpConfigured, sendPhoneOtp, verifyPhoneOtp } from "./integrations/phoneOtp.js";
import { objectStorageConfigured, storeUpload } from "./storage.js";

const app = express();
const port = Number(process.env.PORT) || 3001;
const projectRoot = process.cwd();
const uploadsRoot = path.join(projectRoot, "uploads");
const originVerifySecret = process.env.ORIGIN_VERIFY_SECRET?.trim();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, file.mimetype.startsWith("image/")),
});

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(cors({ origin: process.env.APP_URL || "http://localhost:8080", credentials: true }));
app.use(express.json({ limit: "25mb" }));
app.use(optionalAuth);
app.use("/uploads", express.static(uploadsRoot, { immutable: true, maxAge: "1h" }));

app.use("/api", (req, res, next) => {
  if (process.env.NODE_ENV !== "production") return next();
  if (!originVerifySecret) {
    return res.status(503).json({ data: null, error: { message: "Origin verification is not configured" } });
  }

  const suppliedSecret = req.header("x-bevory-origin-verify") || "";
  const expected = Buffer.from(originVerifySecret);
  const supplied = Buffer.from(suppliedSecret);
  const verified = expected.length === supplied.length && timingSafeEqual(expected, supplied);
  return verified
    ? next()
    : res.status(404).json({ data: null, error: { message: "Not found" } });
});

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const records = await prisma.contentRecord.count();
    res.json({
      status: "ok",
      database: "mysql",
      orm: "prisma",
      records,
      integrations: {
        googleOAuth: googleOAuthConfigured(),
        phoneOtp: phoneOtpConfigured(),
        objectStorage: objectStorageConfigured() ? "s3" : "local",
      },
    });
  } catch (error) {
    res.status(503).json({ status: "error", error: error instanceof Error ? error.message : "Database unavailable" });
  }
});

app.post("/api/auth/signup", async (req: AuthenticatedRequest, res) => {
  try {
    const user = await signUp(req.body ?? {});
    const adminCreatingUser = req.authUser ? await userIsAdmin(req.authUser.id) : false;
    res.status(201).json({ data: { user, session: adminCreatingUser ? null : createSession(user) }, error: null });
  } catch (error) {
    res.status(400).json({ data: null, error: { message: error instanceof Error ? error.message : "Sign-up failed" } });
  }
});

app.post("/api/auth/signin", async (req, res) => {
  try {
    const user = await signIn(String(req.body?.email ?? ""), String(req.body?.password ?? ""));
    res.json({ data: { user, session: createSession(user) }, error: null });
  } catch (error) {
    res.status(401).json({ data: null, error: { message: error instanceof Error ? error.message : "Sign-in failed" } });
  }
});

app.get("/api/auth/providers", (_req, res) => {
  res.json({
    data: { google: googleOAuthConfigured(), phone: phoneOtpConfigured() },
    error: null,
  });
});

const allowedRedirect = (requested: string | undefined) => {
  const fallback = process.env.APP_URL || "http://localhost:8080";
  if (!requested) return fallback;
  try {
    const candidate = new URL(requested);
    const allowed = new URL(fallback);
    return candidate.origin === allowed.origin ? candidate.toString() : fallback;
  } catch {
    return fallback;
  }
};

app.get("/api/auth/google", (req, res) => {
  try {
    if (!googleOAuthConfigured()) throw new Error("Google OAuth credentials are not configured");
    const redirectTo = allowedRedirect(typeof req.query.redirect_to === "string" ? req.query.redirect_to : undefined);
    const state = createOAuthState(redirectTo);
    res.redirect(buildGoogleAuthorizationUrl(googleRedirectUri(req), state));
  } catch (error) {
    res.status(503).json({ data: null, error: { message: error instanceof Error ? error.message : "Google sign-in unavailable" } });
  }
});

app.get("/api/auth/google/callback", async (req, res) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    if (!code || !state) throw new Error("Google callback is missing code or state");
    const redirectTo = allowedRedirect(verifyOAuthState(state));
    const profile = await exchangeGoogleCode(code, googleRedirectUri(req));
    const user = await findOrCreateExternalUser({ ...profile, provider: "google" });
    const session = createSession(user);
    const destination = new URL(redirectTo);
    destination.hash = new URLSearchParams({ bevory_oauth: session.access_token }).toString();
    res.redirect(destination.toString());
  } catch (error) {
    const destination = new URL(process.env.APP_URL || "http://localhost:8080");
    destination.pathname = "/auth";
    destination.searchParams.set("oauth_error", error instanceof Error ? error.message : "Google sign-in failed");
    res.redirect(destination.toString());
  }
});

app.post("/api/auth/otp/send", async (req, res) => {
  try {
    const result = await sendPhoneOtp(String(req.body?.phone ?? ""));
    res.json({ data: result, error: null });
  } catch (error) {
    res.status(400).json({ data: null, error: { message: error instanceof Error ? error.message : "OTP send failed" } });
  }
});

app.post("/api/auth/otp/verify", async (req, res) => {
  try {
    const phone = await verifyPhoneOtp(String(req.body?.phone ?? ""), String(req.body?.token ?? ""));
    const user = await findOrCreatePhoneUser(phone);
    res.json({ data: { user, session: createSession(user) }, error: null });
  } catch (error) {
    res.status(400).json({ data: null, error: { message: error instanceof Error ? error.message : "OTP verification failed" } });
  }
});

app.get("/api/auth/me", async (req: AuthenticatedRequest, res) => {
  if (req.authUser) return res.json({ data: { user: req.authUser }, error: null });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ data: null, error: { message: "No active session" } });
  try {
    const user = await getUserFromToken(token);
    return user
      ? res.json({ data: { user }, error: null })
      : res.status(401).json({ data: null, error: { message: "No active session" } });
  } catch {
    return res.status(401).json({ data: null, error: { message: "Session expired" } });
  }
});

app.post("/api/query", queryHandler);
app.post("/api/functions/:name", functionsHandler);

app.post("/api/storage/upload", upload.single("file"), async (req: AuthenticatedRequest, res) => {
  if (!req.authUser) return res.status(401).json({ data: null, error: { message: "Authentication required" } });
  if (!req.file) return res.status(400).json({ data: null, error: { message: "An image file is required" } });
  const bucket = String(req.body.bucket || "images").replace(/[^a-zA-Z0-9_-]/g, "");
  const safePath = String(req.body.path || req.file.originalname)
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "-"))
    .join("/");
  const stored = await storeUpload({
    uploadsRoot,
    bucket,
    filePath: safePath,
    mimeType: req.file.mimetype,
    body: req.file.buffer,
  });
  const id = randomUUID();
  await prisma.uploadedFile.upsert({
    where: { bucket_path: { bucket, path: safePath } },
    update: { mimeType: req.file.mimetype, size: req.file.size },
    create: { id, bucket, path: safePath, mimeType: req.file.mimetype, size: req.file.size },
  });
  res.status(201).json({ data: { id, path: safePath, publicUrl: stored.publicUrl, provider: stored.provider }, error: null });
});

if (process.env.NODE_ENV === "production" && process.env.SERVE_FRONTEND !== "false") {
  const clientDist = path.join(projectRoot, "dist");
  app.use(express.static(clientDist));
  app.get("/{*splat}", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(500).json({ data: null, error: { message } });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Bevory API listening on http://localhost:${port}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
