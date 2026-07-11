import { describe, expect, it } from "vitest";

import {
  articles,
  articleWordCount,
  formatArticleDate,
  getArticleBySlug,
  readingTimeMinutes,
} from "@/lib/content/blog";

const expectedSlugs = [
  "how-to-support-a-golf-content-creator",
  "how-golf-creators-can-fund-their-content",
  "golf-sponsorship-for-amateur-players",
  "what-does-it-cost-to-create-golf-content",
];

describe("blog content", () => {
  it("publishes exactly the four launch articles", () => {
    expect(articles.map((a) => a.slug).sort()).toEqual(
      [...expectedSlugs].sort(),
    );
  });

  it("has unique slugs", () => {
    const slugs = articles.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every article complete front matter", () => {
    for (const article of articles) {
      expect(article.title.length).toBeGreaterThan(10);
      expect(article.description.length).toBeGreaterThan(50);
      expect(article.description.length).toBeLessThanOrEqual(170);
      expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.heroImage.src).toMatch(/^\/images\//);
      expect(article.heroImage.alt.length).toBeGreaterThan(10);
    }
  });

  it("keeps articles within the substantial-content range", () => {
    for (const article of articles) {
      const words = articleWordCount(article);
      expect(words, `${article.slug} word count`).toBeGreaterThanOrEqual(700);
      expect(words, `${article.slug} word count`).toBeLessThanOrEqual(1600);
    }
  });

  it("computes a plausible reading time", () => {
    for (const article of articles) {
      const minutes = readingTimeMinutes(article);
      expect(minutes).toBeGreaterThanOrEqual(3);
      expect(minutes).toBeLessThanOrEqual(10);
    }
  });

  it("links every article to at least one internal page", () => {
    for (const article of articles) {
      const text = article.blocks
        .map((block) =>
          block.type === "ul" ? block.items.join(" ") : block.text,
        )
        .join(" ");
      expect(text, `${article.slug} internal links`).toMatch(
        /\]\((\/[a-z#-]|\/blog\/)/,
      );
    }
  });

  it("looks up articles by slug", () => {
    expect(getArticleBySlug(expectedSlugs[0])?.slug).toBe(expectedSlugs[0]);
    expect(getArticleBySlug("missing-article")).toBeUndefined();
  });

  it("formats dates in British English", () => {
    expect(formatArticleDate("2026-07-11")).toBe("11 July 2026");
  });
});
