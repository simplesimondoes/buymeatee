import { describe, expect, it } from "vitest";

import sitemap, { staticRoutes } from "@/app/sitemap";
import { articles } from "@/lib/content/blog";

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  it("covers every public static route", () => {
    for (const route of staticRoutes) {
      const expected =
        route === "/"
          ? "https://buymeatee.com/"
          : `https://buymeatee.com${route}`;
      expect(urls).toContain(expected);
    }
  });

  it("covers every blog article", () => {
    for (const article of articles) {
      expect(urls).toContain(`https://buymeatee.com/blog/${article.slug}`);
    }
  });

  it("contains no duplicate URLs", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("has no entry outside the canonical origin", () => {
    for (const url of urls) {
      expect(url.startsWith("https://buymeatee.com/")).toBe(true);
    }
  });
});
