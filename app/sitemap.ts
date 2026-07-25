import type { MetadataRoute } from "next";

import { locales } from "@/i18n/locales";
import { articles } from "@/lib/content/blog";
import { canonicalUrl, hreflangAlternates } from "@/lib/seo/metadata";

/**
 * Indexable public routes only (locale-free paths). Dashboards, settings,
 * admin, sign-in, gift confirmations and creator pages (noindex, ADR-016)
 * are deliberately absent.
 */
export const staticRoutes = [
  "/",
  "/discover",
  "/how-it-works",
  "/for-creators",
  "/for-supporters",
  "/about",
  "/faq",
  "/blog",
  "/privacy",
  "/terms",
  "/impressum",
  "/accessibility",
] as const;

/**
 * One sitemap entry per route × locale; each entry carries the full
 * hreflang alternates map (Google requires alternates to cross-reference
 * from every language version).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = staticRoutes.flatMap((route) =>
    locales.map((locale) => ({
      url: canonicalUrl(route, locale),
      changeFrequency: route === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "/" ? 1 : 0.7,
      alternates: {
        languages: hreflangAlternates(route),
      },
    })),
  );

  const blogEntries: MetadataRoute.Sitemap = articles.flatMap((article) =>
    locales.map((locale) => ({
      url: canonicalUrl(`/blog/${article.slug}`, locale),
      lastModified: new Date(`${article.updatedAt}T00:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
      alternates: {
        languages: hreflangAlternates(`/blog/${article.slug}`),
      },
    })),
  );

  return [...pages, ...blogEntries];
}
