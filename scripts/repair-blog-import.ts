import "dotenv/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma, PrismaClient } from "@prisma/client";

type BlogData = Record<string, unknown>;

export type BlogRecord = {
  key: string;
  recordId: string;
  data: BlogData;
};

type ReconstructedArticle = {
  record: BlogRecord;
  content: string;
  fragmentCount: number;
};

type FragmentAssignment = {
  record: BlogRecord;
  articleId: string | null;
};

const CONTENT_FIELDS = [
  "title", "slug", "excerpt", "content", "cover_image_url", "cover_emoji", "author", "category",
] as const;

const SAFE_PUBLISH_SLUGS = new Set([
  "bourbon-vs-scotch-vs-irish-whiskey-guide",
  "easy-cocktails-with-vodka",
  "easy-cocktails-with-whisky",
  "how-to-choose-your-first-whisky-india-guide",
  "how-to-host-cocktail-party-at-home-india",
  "how-to-pair-whisky-with-indian-food",
  "how-to-read-a-whisky-label",
  "how-to-store-whisky-at-home",
  "single-malt-vs-blended-whisky-difference",
  "whisky-tasting-guide-for-beginners",
  "wine-pairing-with-indian-food",
]);

const FEATURED_SLUGS = new Set([
  "how-to-choose-your-first-whisky-india-guide",
  "whisky-tasting-guide-for-beginners",
  "wine-pairing-with-indian-food",
]);

const rootSlug = (value: unknown) => typeof value === "string"
  && value.length <= 140
  && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

export const isArticleRoot = (data: BlogData) => (
  rootSlug(data.slug)
  && typeof data.title === "string"
  && data.title.length >= 20
  && data.title.length <= 180
  && typeof data.content === "string"
  && data.content.length >= 300
  && typeof data.excerpt === "string"
  && data.excerpt.length >= 40
  && data.excerpt.length <= 320
);

const fragmentLine = (data: BlogData) => {
  const line = CONTENT_FIELDS
    .map((field) => data[field])
    .filter((value) => value !== null && value !== undefined && value !== "" && typeof value !== "object")
    .map(String)
    .join(", ");
  const metadataMarker = `,,${String.fromCodePoint(0x1f4f0)}`;
  const markerIndex = line.indexOf(metadataMarker);
  return {
    line: markerIndex >= 0 ? line.slice(0, markerIndex).trim() : line.trim(),
    terminal: markerIndex >= 0,
  };
};

export const reconstructBlogRecords = (input: BlogRecord[]) => {
  const records = [...input].sort((left, right) => (
    String(left.data.created_at ?? "").localeCompare(String(right.data.created_at ?? ""))
  ));
  const roots = records
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => isArticleRoot(record.data));
  const articles: ReconstructedArticle[] = [];
  const fragments: FragmentAssignment[] = [];
  const rootIndexes = new Set(roots.map(({ index }) => index));

  records.forEach((record, index) => {
    if (!rootIndexes.has(index) && index < (roots[0]?.index ?? records.length)) {
      fragments.push({ record, articleId: null });
    }
  });

  roots.forEach(({ record, index }, rootPosition) => {
    const end = roots[rootPosition + 1]?.index ?? records.length;
    const lines = [String(record.data.content)];
    const articleFragments = records.slice(index + 1, end);
    let terminalSeen = false;
    for (const fragment of articleFragments) {
      fragments.push({ record: fragment, articleId: record.recordId });
      if (terminalSeen) continue;
      const parsed = fragmentLine(fragment.data);
      if (parsed.line) lines.push(parsed.line);
      terminalSeen = parsed.terminal;
    }
    articles.push({
      record,
      content: lines.join("\n\n"),
      fragmentCount: articleFragments.length,
    });
  });

  return { articles, fragments };
};

const categoryFor = (slug: string) => {
  if (/cocktail|party/.test(slug)) return "cocktails";
  if (/\bvs\b|comparison/.test(slug)) return "comparisons";
  if (/price|under-|stores|bars/.test(slug)) return "price-guides";
  if (/calorie|hangover|body|drink-sizes/.test(slug)) return "responsible-drinking";
  if (/brands|brand/.test(slug)) return "brand-guides";
  if (/pairing|tasting|choose|read|store|difference|bourbon/.test(slug)) return "education";
  return "guides";
};

const tagsFor = (slug: string) => slug
  .split("-")
  .filter((token) => token.length > 2 && !["and", "for", "how", "india", "the", "with"].includes(token))
  .slice(0, 8);

const jsonObject = (value: BlogData): Prisma.InputJsonObject => JSON.parse(JSON.stringify(value));

const s3Backup = async (body: Buffer, key: string) => {
  const bucket = process.env.S3_BUCKET?.trim();
  const region = process.env.S3_REGION?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 backup requested but S3 credentials are incomplete");
  }
  const client = new S3Client({
    region,
    endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId, secretAccessKey },
  });
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "application/json",
    ServerSideEncryption: "AES256",
  }));
  return `s3://${bucket}/${key}`;
};

const parseOptions = () => {
  const args = process.argv.slice(2);
  const valueFor = (flag: string) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  return {
    apply: args.includes("--apply"),
    backupS3: args.includes("--backup-s3"),
    reportPath: resolve(valueFor("--report") ?? "reports/blog-repair-report.json"),
  };
};

export const main = async () => {
  const options = parseOptions();
  const prisma = new PrismaClient();
  const now = new Date().toISOString();
  const stamp = now.replace(/[:.]/g, "-");

  try {
    const records = await prisma.contentRecord.findMany({
      where: { tableName: "blog_posts" },
      orderBy: { createdAt: "asc" },
    });
    const blogRecords: BlogRecord[] = records.map((record) => ({
      key: record.key,
      recordId: record.recordId,
      data: record.data && typeof record.data === "object" && !Array.isArray(record.data)
        ? record.data as BlogData
        : {},
    }));
    const backup = Buffer.from(`${JSON.stringify({ createdAt: now, records: blogRecords }, null, 2)}\n`);
    const backupKey = `backups/blog/blog-posts-before-repair-${stamp}.json`;
    const backupLocation = options.backupS3 ? await s3Backup(backup, backupKey) : null;
    const reconstruction = reconstructBlogRecords(blogRecords);
    const published = reconstruction.articles.filter(({ record }) => SAFE_PUBLISH_SLUGS.has(String(record.data.slug)));

    const report = {
      startedAt: now,
      apply: options.apply,
      sourceRecords: blogRecords.length,
      reconstructedArticles: reconstruction.articles.length,
      quarantinedFragments: reconstruction.fragments.length,
      publishedArticles: published.map(({ record }) => record.data.slug),
      backupLocation,
      articles: reconstruction.articles.map(({ record, content, fragmentCount }) => ({
        id: record.recordId,
        slug: record.data.slug,
        title: record.data.title,
        fragmentCount,
        wordCount: content.split(/\s+/).filter(Boolean).length,
        publish: SAFE_PUBLISH_SLUGS.has(String(record.data.slug)),
      })),
    };

    if (options.apply) {
      const articleUpdates = reconstruction.articles.map(({ record, content, fragmentCount }) => {
        const slug = String(record.data.slug);
        const publish = SAFE_PUBLISH_SLUGS.has(slug);
        const data = jsonObject({
          ...record.data,
          content,
          author: "Bevory Editorial",
          category: categoryFor(slug),
          tags: tagsFor(slug),
          is_published: publish,
          is_featured: FEATURED_SLUGS.has(slug),
          meta_title: record.data.title,
          meta_description: record.data.excerpt,
          published_at: publish ? record.data.published_at ?? now : null,
          legacy_reconstructed: true,
          legacy_fragment_count: fragmentCount,
          updated_at: now,
        });
        return prisma.contentRecord.update({ where: { key: record.key }, data: { data } });
      });

      const fragmentUpdates = reconstruction.fragments.map(({ record, articleId }) => {
        const key = `legacy_blog_fragments:${record.recordId}`;
        const data = jsonObject({
          ...record.data,
          quarantined_from: "blog_posts",
          reconstructed_article_id: articleId,
          quarantined_at: now,
        });
        return prisma.contentRecord.update({
          where: { key: record.key },
          data: { key, tableName: "legacy_blog_fragments", data },
        });
      });

      const operations = [...articleUpdates, ...fragmentUpdates];
      for (let index = 0; index < operations.length; index += 100) {
        await prisma.$transaction(operations.slice(index, index + 100));
      }
    }

    await mkdir(dirname(options.reportPath), { recursive: true });
    await writeFile(options.reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
      report: options.reportPath,
      apply: options.apply,
      sourceRecords: report.sourceRecords,
      reconstructedArticles: report.reconstructedArticles,
      quarantinedFragments: report.quarantinedFragments,
      publishedArticles: report.publishedArticles.length,
      backupLocation,
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
