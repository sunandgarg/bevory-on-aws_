import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type UploadInput = {
  uploadsRoot: string;
  bucket: string;
  filePath: string;
  mimeType: string;
  body: Buffer;
};

export const objectStorageConfigured = () => Boolean(
  process.env.S3_BUCKET?.trim()
  && process.env.S3_REGION?.trim()
  && process.env.S3_ACCESS_KEY_ID?.trim()
  && process.env.S3_SECRET_ACCESS_KEY?.trim()
  && process.env.S3_PUBLIC_URL?.trim(),
);

const publicObjectUrl = (key: string) => {
  const base = process.env.S3_PUBLIC_URL!.replace(/\/$/, "");
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
};

export const storeUpload = async (input: UploadInput) => {
  if (objectStorageConfigured()) {
    const configuredBucket = process.env.S3_BUCKET!.trim();
    const key = `${input.bucket}/${input.filePath}`;
    const client = new S3Client({
      region: process.env.S3_REGION!.trim(),
      endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!.trim(),
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!.trim(),
      },
    });
    await client.send(new PutObjectCommand({
      Bucket: configuredBucket,
      Key: key,
      Body: input.body,
      ContentType: input.mimeType,
      CacheControl: "public, max-age=31536000, immutable",
    }));
    return { provider: "s3" as const, publicUrl: publicObjectUrl(key) };
  }

  const destination = path.join(input.uploadsRoot, input.bucket, input.filePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, input.body);
  const encoded = [input.bucket, ...input.filePath.split("/")].map(encodeURIComponent).join("/");
  return { provider: "local" as const, publicUrl: `/uploads/${encoded}` };
};
