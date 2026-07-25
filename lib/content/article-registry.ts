import type { AppLocale } from "@/i18n/locales";
import type { Article } from "@/lib/content/blog";
import { costOfGolfContent } from "@/lib/content/articles/what-does-it-cost-to-create-golf-content";
import { fundGolfContent } from "@/lib/content/articles/how-golf-creators-can-fund-their-content";
import { golfSponsorshipAmateurs } from "@/lib/content/articles/golf-sponsorship-for-amateur-players";
import { supportGolfCreator } from "@/lib/content/articles/how-to-support-a-golf-content-creator";
import { costOfGolfContentDe } from "@/lib/content/articles/what-does-it-cost-to-create-golf-content.de";
import { costOfGolfContentFr } from "@/lib/content/articles/what-does-it-cost-to-create-golf-content.fr";
import { costOfGolfContentEs } from "@/lib/content/articles/what-does-it-cost-to-create-golf-content.es";
import { costOfGolfContentIt } from "@/lib/content/articles/what-does-it-cost-to-create-golf-content.it";
import { costOfGolfContentJa } from "@/lib/content/articles/what-does-it-cost-to-create-golf-content.ja";
import { costOfGolfContentKo } from "@/lib/content/articles/what-does-it-cost-to-create-golf-content.ko";
import { costOfGolfContentPt } from "@/lib/content/articles/what-does-it-cost-to-create-golf-content.pt";
import { fundGolfContentDe } from "@/lib/content/articles/how-golf-creators-can-fund-their-content.de";
import { fundGolfContentFr } from "@/lib/content/articles/how-golf-creators-can-fund-their-content.fr";
import { fundGolfContentEs } from "@/lib/content/articles/how-golf-creators-can-fund-their-content.es";
import { fundGolfContentIt } from "@/lib/content/articles/how-golf-creators-can-fund-their-content.it";
import { fundGolfContentJa } from "@/lib/content/articles/how-golf-creators-can-fund-their-content.ja";
import { fundGolfContentKo } from "@/lib/content/articles/how-golf-creators-can-fund-their-content.ko";
import { fundGolfContentPt } from "@/lib/content/articles/how-golf-creators-can-fund-their-content.pt";
import { golfSponsorshipAmateursDe } from "@/lib/content/articles/golf-sponsorship-for-amateur-players.de";
import { golfSponsorshipAmateursFr } from "@/lib/content/articles/golf-sponsorship-for-amateur-players.fr";
import { golfSponsorshipAmateursEs } from "@/lib/content/articles/golf-sponsorship-for-amateur-players.es";
import { golfSponsorshipAmateursIt } from "@/lib/content/articles/golf-sponsorship-for-amateur-players.it";
import { golfSponsorshipAmateursJa } from "@/lib/content/articles/golf-sponsorship-for-amateur-players.ja";
import { golfSponsorshipAmateursKo } from "@/lib/content/articles/golf-sponsorship-for-amateur-players.ko";
import { golfSponsorshipAmateursPt } from "@/lib/content/articles/golf-sponsorship-for-amateur-players.pt";
import { supportGolfCreatorDe } from "@/lib/content/articles/how-to-support-a-golf-content-creator.de";
import { supportGolfCreatorFr } from "@/lib/content/articles/how-to-support-a-golf-content-creator.fr";
import { supportGolfCreatorEs } from "@/lib/content/articles/how-to-support-a-golf-content-creator.es";
import { supportGolfCreatorIt } from "@/lib/content/articles/how-to-support-a-golf-content-creator.it";
import { supportGolfCreatorJa } from "@/lib/content/articles/how-to-support-a-golf-content-creator.ja";
import { supportGolfCreatorKo } from "@/lib/content/articles/how-to-support-a-golf-content-creator.ko";
import { supportGolfCreatorPt } from "@/lib/content/articles/how-to-support-a-golf-content-creator.pt";

/**
 * Locale-aware article registry.
 *
 * English is the source of truth; every article has an `en` entry and other
 * locales are optional. Fallback is structural and per-article: a locale that
 * has no registered translation for a slug gets the English article, so a
 * partially translated catalog never produces missing pages.
 *
 * ## Translation convention
 *
 * A translated article lives at `lib/content/articles/<slug>.<locale>.ts`
 * (e.g. `lib/content/articles/how-to-support-a-golf-content-creator.de.ts`),
 * exports the same `Article` shape and keeps the SAME `slug` — slugs are
 * language-neutral URL identity and must never change per locale. Register it
 * here by adding it to the article's entry:
 *
 * ```ts
 * import { supportGolfCreatorDe } from "@/lib/content/articles/how-to-support-a-golf-content-creator.de";
 *
 * [supportGolfCreator.slug]: {
 *   en: supportGolfCreator,
 *   de: supportGolfCreatorDe,
 * },
 * ```
 *
 * `title`, `description` and `blocks` are translated; `publishedAt`,
 * `updatedAt` and `heroImage` normally stay identical to the English source.
 */

type LocalizedArticle = { en: Article } & Partial<Record<AppLocale, Article>>;

const articleRegistry: Record<string, LocalizedArticle> = {
  [supportGolfCreator.slug]: {
    en: supportGolfCreator,
    de: supportGolfCreatorDe,
    fr: supportGolfCreatorFr,
    es: supportGolfCreatorEs,
    it: supportGolfCreatorIt,
    ja: supportGolfCreatorJa,
    ko: supportGolfCreatorKo,
    pt: supportGolfCreatorPt,
  },
  [fundGolfContent.slug]: {
    en: fundGolfContent,
    de: fundGolfContentDe,
    fr: fundGolfContentFr,
    es: fundGolfContentEs,
    it: fundGolfContentIt,
    ja: fundGolfContentJa,
    ko: fundGolfContentKo,
    pt: fundGolfContentPt,
  },
  [golfSponsorshipAmateurs.slug]: {
    en: golfSponsorshipAmateurs,
    de: golfSponsorshipAmateursDe,
    fr: golfSponsorshipAmateursFr,
    es: golfSponsorshipAmateursEs,
    it: golfSponsorshipAmateursIt,
    ja: golfSponsorshipAmateursJa,
    ko: golfSponsorshipAmateursKo,
    pt: golfSponsorshipAmateursPt,
  },
  [costOfGolfContent.slug]: {
    en: costOfGolfContent,
    de: costOfGolfContentDe,
    fr: costOfGolfContentFr,
    es: costOfGolfContentEs,
    it: costOfGolfContentIt,
    ja: costOfGolfContentJa,
    ko: costOfGolfContentKo,
    pt: costOfGolfContentPt,
  },
};

/** All article slugs, newest first (by English publish date). */
export const articleSlugs: string[] = Object.values(articleRegistry)
  .sort((a, b) => b.en.publishedAt.localeCompare(a.en.publishedAt))
  .map((entry) => entry.en.slug);

/**
 * All articles for a locale, newest first. Ordering follows the English
 * publish dates so every locale lists articles in the same order.
 */
export function getArticles(locale: AppLocale): Article[] {
  return articleSlugs.map((slug) => {
    const entry = articleRegistry[slug];
    return entry[locale] ?? entry.en;
  });
}

/**
 * One article by language-neutral slug, in the requested locale when a
 * translation is registered, otherwise the English source.
 */
export function getArticle(
  slug: string,
  locale: AppLocale,
): Article | undefined {
  const entry = articleRegistry[slug];
  if (!entry) return undefined;
  return entry[locale] ?? entry.en;
}
