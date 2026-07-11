import { canonicalUrl } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

/**
 * JSON-LD builders. Structured data must always match what the visitor
 * can actually see — no invented organisation detail (see .ai/skills/seo.md).
 */

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: canonicalUrl("/"),
    description: siteConfig.description,
  };
}

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: canonicalUrl(item.href),
    })),
  };
}

export type FaqEntry = {
  question: string;
  answer: string;
};

export function faqJsonLd(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: {
      "@type": "Organization",
      name: `${siteConfig.name} Editorial`,
      url: canonicalUrl("/"),
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: canonicalUrl("/"),
    },
    mainEntityOfPage: canonicalUrl(`/blog/${input.slug}`),
    ...(input.image ? { image: [canonicalUrl(input.image)] } : {}),
  };
}
