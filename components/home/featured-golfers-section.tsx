import { MapPin } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { ButtonLink } from "@/components/button-link";
import { ExampleBadge } from "@/components/example-badge";
import { ProgressBar } from "@/components/progress-bar";
import { SectionHeading } from "@/components/section-heading";
import type { AppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { getFeaturedGoals } from "@/lib/discover/data";
import { formatMinorAmount, formatPercent } from "@/lib/i18n/format";

/**
 * One golfer's journey, full width (ADR-021): the platform currently has a
 * single active goal, so this section spotlights exactly one card — the
 * Discover hybrid rule still applies (the top real published goal, or one
 * clearly-labelled Preview example when none exists / Supabase is absent).
 */
export async function FeaturedGolfersSection() {
  const t = await getTranslations("home");
  const tDiscover = await getTranslations("discover");
  const tContent = await getTranslations("content");
  const locale = (await getLocale()) as AppLocale;
  const featured = await getFeaturedGoals(1);
  const goal = featured.items[0];
  if (!goal) return null;

  // Preview cards carry `content`-namespace keys in their text fields
  // (ADR-007); real cards carry user-generated strings verbatim.
  const text = <T extends string | null>(value: T): string | T =>
    goal.isPreview && value ? tContent(value as never) : value;

  const title = text(goal.title);
  const description = text(goal.description);
  const imageAlt = text(goal.imageAlt) || "";
  const creatorName = goal.creatorName || tDiscover("goalCard.creatorFallback");
  const raised = formatMinorAmount(goal.raisedMinor, goal.currency, locale);
  const target = formatMinorAmount(goal.targetMinor, goal.currency, locale);
  const place = text(goal.location) ?? text(goal.country);

  return (
    <section className="bg-mist">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          heading={t("featuredGolfers.heading")}
          intro={t("featuredGolfers.intro")}
        />
        <article className="mt-12 grid overflow-hidden rounded-3xl border border-stone bg-white lg:grid-cols-[3fr_2fr]">
          <div className="relative aspect-[16/9] w-full bg-mist lg:aspect-auto lg:h-full lg:min-h-[26rem]">
            {goal.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={goal.imageSrc}
                alt={imageAlt}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-forest to-forest-dark" />
            )}
            {goal.isPreview ? (
              <ExampleBadge label="Preview" className="absolute left-4 top-4" />
            ) : null}
          </div>
          <div className="flex flex-col p-6 sm:p-8">
            <h3 className="font-serif text-2xl font-semibold text-forest">
              {title}
            </h3>
            <p className="mt-1 text-sm text-ink/70">
              {creatorName}
              {place ? (
                <span className="inline-flex items-center gap-1 text-ink/55">
                  {" · "}
                  <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                  {place}
                </span>
              ) : null}
            </p>
            {description ? (
              <p className="mt-4 line-clamp-5 flex-1 text-sm leading-relaxed text-ink/75">
                {description}
              </p>
            ) : (
              <div className="flex-1" />
            )}
            <div className="mt-6 flex items-baseline justify-between text-sm">
              <span className="font-semibold text-forest">
                {goal.started
                  ? tDiscover("goalCard.raisedOfTarget", { raised, target })
                  : tDiscover("goalCard.targetGoal", { target })}
              </span>
              <span className="shrink-0 font-semibold text-gold-deep">
                {goal.started
                  ? formatPercent(goal.percent, locale)
                  : tDiscover("goalCard.beTheFirst")}
              </span>
            </div>
            <ProgressBar
              value={goal.percent}
              label={tDiscover("goalCard.progressLabel", {
                title,
                raised,
                target,
              })}
              className="mt-2"
            />
            {goal.creatorHref ? (
              <Link
                href={goal.creatorHref}
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
              >
                {tDiscover("goalCard.support")}
              </Link>
            ) : (
              <Link
                href="/how-it-works"
                className="mt-6 inline-flex items-center text-sm font-medium text-gold-deep hover:text-forest"
              >
                {tDiscover("goalCard.seeHowGoalsWork")}
                <span aria-hidden="true" className="ml-1">
                  →
                </span>
              </Link>
            )}
          </div>
        </article>
        {featured.preview ? (
          <p className="mt-6 text-center text-sm text-ink/70">
            {t("featuredGolfers.previewNote")}
          </p>
        ) : null}
        <div className="mt-10 text-center">
          <ButtonLink href="/discover" variant="secondary">
            {t("featuredGolfers.cta")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
