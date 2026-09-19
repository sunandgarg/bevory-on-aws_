import { describe, expect, it } from "vitest";
import { isArticleRoot, reconstructBlogRecords, type BlogRecord } from "./repair-blog-import.js";

const record = (recordId: string, createdAt: string, data: Record<string, unknown>): BlogRecord => ({
  key: `blog_posts:${recordId}`,
  recordId,
  data: { id: recordId, created_at: createdAt, ...data },
});

describe("legacy blog repair", () => {
  it("reconstructs comma-split content in chronological order", () => {
    const root = record("article", "2026-01-01T00:00:00.000Z", {
      slug: "how-to-read-a-label",
      title: "How to Read a Bottle Label Without Feeling Lost",
      excerpt: "A practical introduction to the information printed on a bottle label.",
      content: "A".repeat(320),
    });
    const fragment = record("fragment", "2026-01-01T00:00:01.000Z", {
      title: "Look for the category",
      slug: "the producer",
      excerpt: "and the stated volume.",
    });
    const trailer = record("trailer", "2026-01-01T00:00:02.000Z", {
      title: `Drink responsibly.,,${String.fromCodePoint(0x1f4f0)},Bevory Editorial`,
    });

    expect(isArticleRoot(root.data)).toBe(true);
    const result = reconstructBlogRecords([trailer, root, fragment]);
    expect(result.articles).toHaveLength(1);
    expect(result.fragments).toHaveLength(2);
    expect(result.articles[0].content).toContain("Look for the category, the producer, and the stated volume.");
    expect(result.articles[0].content).toContain("Drink responsibly.");
    expect(result.articles[0].content).not.toContain("Bevory Editorial");
  });
});
