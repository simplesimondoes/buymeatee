import { costOfGolfContent } from "@/lib/content/articles/what-does-it-cost-to-create-golf-content";
import { fundGolfContent } from "@/lib/content/articles/how-golf-creators-can-fund-their-content";
import { golfSponsorshipAmateurs } from "@/lib/content/articles/golf-sponsorship-for-amateur-players";
import { supportGolfCreator } from "@/lib/content/articles/how-to-support-a-golf-content-creator";
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

export const articles: Article[] = [
  supportGolfCreator,
  fundGolfContent,
  golfSponsorshipAmateurs,
  costOfGolfContent,
].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

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

export function formatArticleDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
