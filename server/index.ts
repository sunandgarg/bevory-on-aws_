import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Prisma } from "@prisma/client";
import { createSession, getUserFromToken, optionalAuth, signIn, signUp, userIsAdmin, type AuthenticatedRequest } from "./auth.js";
import { queryHandler } from "./data.js";
import { functionsHandler } from "./functions.js";
import { prisma } from "./db.js";

const app = express();
const port = Number(process.env.PORT) || 3001;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uploadsRoot = path.join(projectRoot, "uploads");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, file.mimetype.startsWith("image/")),
});

app.disable("x-powered-by");
app.use(cors({ origin: process.env.APP_URL || "http://localhost:8080", credentials: true }));
app.use(express.json({ limit: "25mb" }));
app.use(optionalAuth);
app.use("/uploads", express.static(uploadsRoot, { immutable: true, maxAge: "1h" }));

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const records = await prisma.contentRecord.count();
    res.json({ status: "ok", database: "mysql", orm: "prisma", records });
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
  const destination = path.join(uploadsRoot, bucket, safePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, req.file.buffer);
  const id = randomUUID();
  await prisma.uploadedFile.create({
    data: { id, bucket, path: safePath, mimeType: req.file.mimetype, size: req.file.size },
  });
  res.status(201).json({ data: { id, path: safePath }, error: null });
});

if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(projectRoot, "dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
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
