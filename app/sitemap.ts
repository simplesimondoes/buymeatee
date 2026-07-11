import type { MetadataRoute } from "next";

import { articles } from "@/lib/content/blog";
import { canonicalUrl } from "@/lib/seo/metadata";

export const staticRoutes = [
  "/",
  "/how-it-works",
  "/for-creators",
  "/for-supporters",
  "/about",
  "/faq",
  "/blog",
  "/privacy",
  "/terms",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: canonicalUrl(route),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: canonicalUrl(`/blog/${article.slug}`),
    lastModified: new Date(`${article.updatedAt}T00:00:00Z`),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...pages, ...blogEntries];
}
