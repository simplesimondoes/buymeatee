import { htmlLang, type AppLocale } from "@/i18n/locales";
import { canonicalUrl } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

/**
 * JSON-LD builders. Structured data must always match what the visitor
 * can actually see — no invented organisation detail (see .ai/skills/seo.md).
 * Every builder takes the active locale: URLs are locale-prefixed and
 * `inLanguage` reflects the page language. Creator names and other
 * user-generated content are never machine-translated.
 */

export function webSiteJsonLd(locale: AppLocale, description?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: canonicalUrl("/", locale),
    description: description ?? siteConfig.description,
    inLanguage: htmlLang[locale],
  };
}

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export function breadcrumbJsonLd(items: BreadcrumbItem[], locale: AppLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: canonicalUrl(item.href, locale),
    })),
  };
}

export type FaqEntry = {
  question: string;
  answer: string;
};

export function faqJsonLd(entries: FaqEntry[], locale: AppLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: htmlLang[locale],
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

export function articleJsonLd(
  input: {
    title: string;
    description: string;
    slug: string;
    datePublished: string;
    dateModified: string;
    image?: string;
  },
  locale: AppLocale,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    inLanguage: htmlLang[locale],
    author: {
      "@type": "Organization",
      name: `${siteConfig.name} Editorial`,
      url: canonicalUrl("/", locale),
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: canonicalUrl("/", locale),
    },
    mainEntityOfPage: canonicalUrl(`/blog/${input.slug}`, locale),
    ...(input.image
      ? { image: [`${siteConfig.url.replace(/\/$/, "")}${input.image}`] }
      : {}),
  };
}
