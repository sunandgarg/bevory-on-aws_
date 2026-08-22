import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { objectStorageConfigured, storeUpload } from "./storage.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("upload storage", () => {
  it("uses local persistent storage when S3 is not fully configured", async () => {
    expect(objectStorageConfigured()).toBe(false);
    const uploadsRoot = await mkdtemp(path.join(tmpdir(), "bevory-storage-"));
    tempRoots.push(uploadsRoot);
    const stored = await storeUpload({
      uploadsRoot,
      bucket: "images",
      filePath: "tests/image.webp",
      mimeType: "image/webp",
      body: Buffer.from("verified-image"),
    });
    expect(stored).toEqual({ provider: "local", publicUrl: "/uploads/images/tests/image.webp" });
    expect(await readFile(path.join(uploadsRoot, "images/tests/image.webp"), "utf8")).toBe("verified-image");
  });
});
