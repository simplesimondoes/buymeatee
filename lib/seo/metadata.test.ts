import { describe, expect, it } from "vitest";

import { locales } from "@/i18n/locales";
import {
  canonicalUrl,
  hreflangAlternates,
  localizedPath,
  pageMetadata,
  rootMetadata,
} from "@/lib/seo/metadata";

describe("localizedPath", () => {
  it("prefixes route paths with the locale", () => {
    expect(localizedPath("/for-creators", "en")).toBe("/en/for-creators");
    expect(localizedPath("/for-creators", "de")).toBe("/de/for-creators");
  });

  it("collapses the bare root to just the locale segment", () => {
    expect(localizedPath("/", "en")).toBe("/en");
    expect(localizedPath("/", "ja")).toBe("/ja");
  });
});

describe("canonicalUrl", () => {
  it("builds absolute locale-prefixed URLs from route paths", () => {
    expect(canonicalUrl("/for-creators", "en")).toBe(
      "https://buymeatee.com/en/for-creators",
    );
    expect(canonicalUrl("/for-creators", "fr")).toBe(
      "https://buymeatee.com/fr/for-creators",
    );
  });

  it("maps the homepage to the locale root without a trailing slash", () => {
    expect(canonicalUrl("/", "en")).toBe("https://buymeatee.com/en");
    expect(canonicalUrl("/", "de")).toBe("https://buymeatee.com/de");
  });
});

describe("hreflangAlternates", () => {
  const alternates = hreflangAlternates("/for-creators");

  it("lists every supported locale with its own URL", () => {
    for (const locale of locales) {
      expect(alternates[locale]).toBe(
        `https://buymeatee.com/${locale}/for-creators`,
      );
    }
  });

  it("points x-default at the English URL", () => {
    expect(alternates["x-default"]).toBe(
      "https://buymeatee.com/en/for-creators",
    );
  });

  it("contains exactly the locales plus x-default", () => {
    expect(Object.keys(alternates).sort()).toEqual(
      [...locales, "x-default"].sort(),
    );
  });
});

describe("pageMetadata", () => {
  const metadata = pageMetadata({
    title: "For Golf Creators",
    description: "A description.",
    path: "/for-creators",
    locale: "en",
  });

  it("sets title, description and a self-referencing canonical", () => {
    expect(metadata.title).toBe("For Golf Creators");
    expect(metadata.description).toBe("A description.");
    expect(metadata.alternates?.canonical).toBe(
      "https://buymeatee.com/en/for-creators",
    );
  });

  it("canonicalises non-English pages to their own locale, never English", () => {
    const german = pageMetadata({
      title: "Für Golf-Creator",
      description: "Eine Beschreibung.",
      path: "/for-creators",
      locale: "de",
    });
    expect(german.alternates?.canonical).toBe(
      "https://buymeatee.com/de/for-creators",
    );
    expect(german.openGraph).toMatchObject({
      url: "https://buymeatee.com/de/for-creators",
      locale: "de_DE",
    });
  });

  it("includes hreflang alternates for every locale plus x-default", () => {
    const languages = metadata.alternates?.languages as Record<string, string>;
    expect(languages).toBeDefined();
    for (const locale of locales) {
      expect(languages[locale]).toBe(
        `https://buymeatee.com/${locale}/for-creators`,
      );
    }
    expect(languages["x-default"]).toBe(
      "https://buymeatee.com/en/for-creators",
    );
  });

  it("omits hreflang alternates when noHreflang is set", () => {
    const noindex = pageMetadata({
      title: "T",
      description: "D",
      path: "/t/someone",
      locale: "en",
      noHreflang: true,
    });
    expect(noindex.alternates?.canonical).toBe(
      "https://buymeatee.com/en/t/someone",
    );
    expect(noindex.alternates?.languages).toBeUndefined();
    expect(
      (noindex.openGraph as { alternateLocale?: string[] }).alternateLocale,
    ).toBeUndefined();
  });

  it("marks noindex pages robots:noindex and drops hreflang", () => {
    const legal = pageMetadata({
      title: "Privacy",
      description: "D",
      path: "/privacy",
      locale: "en",
      noindex: true,
    });
    expect(legal.robots).toMatchObject({ index: false, follow: false });
    expect(legal.alternates?.canonical).toBe("https://buymeatee.com/en/privacy");
    expect(legal.alternates?.languages).toBeUndefined();
    expect(
      (legal.openGraph as { alternateLocale?: string[] }).alternateLocale,
    ).toBeUndefined();
  });

  it("leaves robots unset for indexable pages", () => {
    expect(metadata.robots).toBeUndefined();
  });

  it("mirrors values into Open Graph and Twitter cards", () => {
    expect(metadata.openGraph).toMatchObject({
      title: "For Golf Creators",
      description: "A description.",
      url: "https://buymeatee.com/en/for-creators",
      siteName: "BuyMeATee",
      locale: "en_GB",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "For Golf Creators",
    });
  });

  it("lists the other locales' og codes as alternateLocale", () => {
    const og = metadata.openGraph as { alternateLocale?: string[] };
    expect(og.alternateLocale).toContain("de_DE");
    expect(og.alternateLocale).toContain("ja_JP");
    expect(og.alternateLocale).not.toContain("en_GB");
    expect(og.alternateLocale).toHaveLength(locales.length - 1);
  });

  it("supports the article OG type for blog posts", () => {
    const article = pageMetadata({
      title: "T",
      description: "D",
      path: "/blog/x",
      locale: "en",
      ogType: "article",
    });
    expect(article.openGraph).toMatchObject({ type: "article" });
  });
});

describe("rootMetadata", () => {
  it("uses the brand default title and template", () => {
    const metadata = rootMetadata("en");
    expect(metadata.title).toEqual({
      default: "BuyMeATee — For Golfers With a Goal",
      template: "%s | BuyMeATee",
    });
    const base = metadata.metadataBase;
    expect(base).toBeInstanceOf(URL);
    expect((base as URL).origin).toBe("https://buymeatee.com");
  });

  it("canonicalises the root per locale with full hreflang alternates", () => {
    const metadata = rootMetadata("de");
    expect(metadata.alternates?.canonical).toBe("https://buymeatee.com/de");
    const languages = metadata.alternates?.languages as Record<string, string>;
    expect(languages["x-default"]).toBe("https://buymeatee.com/en");
    expect(languages.fr).toBe("https://buymeatee.com/fr");
    expect(metadata.openGraph).toMatchObject({
      url: "https://buymeatee.com/de",
      locale: "de_DE",
    });
  });

  it("allows overriding title and description", () => {
    const metadata = rootMetadata("en", {
      title: "Custom",
      description: "Custom description.",
    });
    expect(metadata.title).toEqual({
      default: "Custom",
      template: "%s | BuyMeATee",
    });
    expect(metadata.description).toBe("Custom description.");
  });
});
