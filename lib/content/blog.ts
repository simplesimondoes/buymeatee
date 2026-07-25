import { costOfGolfContent } from "@/lib/content/articles/what-does-it-cost-to-create-golf-content";
import { fundGolfContent } from "@/lib/content/articles/how-golf-creators-can-fund-their-content";
import { golfSponsorshipAmateurs } from "@/lib/content/articles/golf-sponsorship-for-amateur-players";
import { golfCrowdfundingAlternative } from "@/lib/content/articles/looking-for-golf-crowdfunding";
import { supportGolfCreator } from "@/lib/content/articles/how-to-support-a-golf-content-creator";
import { defaultLocale, type AppLocale } from "@/i18n/locales";
import { formatDate } from "@/lib/i18n/format";
import { stripInline } from "@/lib/content/inline";
import type { SiteImage } from "@/lib/content/images";

/**
 * Blog architecture: typed structured content in the repository (ADR-003).
 * No CMS. Article bodies are typed blocks; paragraphs and list items may
 * contain markdown-style inline links, parsed by lib/content/inline.ts.
 */

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string };

export type Article = {
  slug: string;
  title: string;
  description: string;
  /** ISO dates. */
  publishedAt: string;
  updatedAt: string;
  heroImage: SiteImage;
  blocks: ArticleBlock[];
};

export const articleAuthor = "BuyMeATee Editorial";

/**
 * The English source articles, newest first. Language-neutral consumers
 * (sitemap, feeds) keep using this; locale-aware pages should use
 * `getArticles(locale)` / `getArticle(slug, locale)` from
 * `lib/content/article-registry.ts` instead.
 */
export const articles: Article[] = [
  supportGolfCreator,
  fundGolfContent,
  golfSponsorshipAmateurs,
  costOfGolfContent,
  golfCrowdfundingAlternative,
].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

/**
 * English-only lookup.
 *
 * @deprecated Use `getArticle(slug, locale)` from
 * `lib/content/article-registry.ts` for locale-aware lookup (falls back to
 * English per article).
 */
export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

const WORDS_PER_MINUTE = 225;

export function articleWordCount(article: Article): number {
  const text = article.blocks
    .map((block) =>
      block.type === "ul" ? block.items.join(" ") : block.text,
    )
    .join(" ");
  return stripInline(text).split(/\s+/).filter(Boolean).length;
}

export function readingTimeMinutes(article: Article): number {
  return Math.max(1, Math.ceil(articleWordCount(article) / WORDS_PER_MINUTE));
}

/** Format an article's ISO date for display in the given locale. */
export function formatArticleDate(iso: string, locale: AppLocale): string;
/**
 * @deprecated Pass the active locale explicitly — the no-locale form always
 * renders English and exists only while call sites migrate.
 */
export function formatArticleDate(iso: string): string;
export function formatArticleDate(
  iso: string,
  locale: AppLocale = defaultLocale,
): string {
  return formatDate(`${iso}T00:00:00Z`, locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
