import { describe, expect, it } from "vitest";

import sitemap, { staticRoutes } from "@/app/sitemap";
import { defaultLocale, locales } from "@/i18n/locales";
import { audiences } from "@/lib/content/audiences";
import { articles } from "@/lib/content/blog";

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  it("covers every public static route in every locale", () => {
    for (const route of staticRoutes) {
      for (const locale of locales) {
        const path = route === "/" ? `/${locale}` : `/${locale}${route}`;
        expect(urls).toContain(`https://buymeatee.com${path}`);
      }
    }
  });

  it("covers every audience landing page in every locale", () => {
    for (const audience of audiences) {
      for (const locale of locales) {
        expect(urls).toContain(
          `https://buymeatee.com/${locale}/for/${audience.slug}`,
        );
      }
    }
  });

  it("covers every blog article in every locale", () => {
    for (const article of articles) {
      for (const locale of locales) {
        expect(urls).toContain(
          `https://buymeatee.com/${locale}/blog/${article.slug}`,
        );
      }
    }
  });

  it("gives every entry hreflang alternates for all locales plus x-default", () => {
    for (const entry of entries) {
      const languages = entry.alternates?.languages as Record<string, string>;
      expect(languages).toBeDefined();
      for (const locale of locales) {
        expect(languages[locale]).toMatch(
          new RegExp(`^https://buymeatee\\.com/${locale}`),
        );
      }
      expect(languages["x-default"]).toBe(languages[defaultLocale]);
    }
  });

  it("contains no duplicate URLs", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("contains no unprefixed URLs and nothing outside the canonical origin", () => {
    const localePattern = new RegExp(
      `^https://buymeatee\\.com/(${locales.join("|")})(/|$)`,
    );
    for (const url of urls) {
      expect(url).toMatch(localePattern);
    }
  });

  it("includes no private or noindex surfaces", () => {
    for (const url of urls) {
      expect(url).not.toMatch(/\/(dashboard|settings|admin|sign-in|gifts|t)\//);
      // Legal pages are noindex (operator name/address kept out of search).
      expect(url).not.toMatch(/\/(privacy|terms|impressum|accessibility)$/);
    }
  });
});
