import { describe, expect, it } from "vitest";

import { locales } from "@/i18n/locales";
import {
  articleSlugs,
  getArticle,
  getArticles,
} from "@/lib/content/article-registry";
import { articles } from "@/lib/content/blog";

describe("article registry", () => {
  it("lists every English article slug, newest first", () => {
    expect(articleSlugs).toEqual(articles.map((article) => article.slug));
  });

  it("returns the English source for the default locale", () => {
    expect(getArticles("en")).toEqual(articles);
    for (const article of articles) {
      expect(getArticle(article.slug, "en")).toBe(article);
    }
  });

  it("falls back to English per article for untranslated locales", () => {
    for (const locale of locales) {
      const localized = getArticles(locale);
      expect(localized).toHaveLength(articles.length);
      for (const article of localized) {
        // Until a translation is registered, every locale gets the English
        // article — slugs are language-neutral and never change.
        expect(articleSlugs).toContain(article.slug);
        expect(article.title.length).toBeGreaterThan(0);
      }
      expect(getArticle(articleSlugs[0], locale)?.slug).toBe(articleSlugs[0]);
    }
  });

  it("keeps ordering identical across locales", () => {
    for (const locale of locales) {
      expect(getArticles(locale).map((article) => article.slug)).toEqual(
        articleSlugs,
      );
    }
  });

  it("returns undefined for unknown slugs", () => {
    expect(getArticle("missing-article", "en")).toBeUndefined();
    expect(getArticle("missing-article", "de")).toBeUndefined();
  });
});
