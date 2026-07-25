import { Link } from "@/i18n/navigation";
import { MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ExampleBadge } from "@/components/example-badge";
import { ProgressBar } from "@/components/progress-bar";
import { usePreviewText } from "@/components/discover/preview-text";
import type { AppLocale } from "@/i18n/locales";
import { categoryLabelKey } from "@/lib/discover/categories";
import type { DiscoverGoalCard } from "@/lib/discover/types";
import { formatMinorAmount, formatPercent } from "@/lib/i18n/format";

/** A goal as browsed on Discover — real or clearly-labelled Preview. */
export function GoalCardView({ goal }: { goal: DiscoverGoalCard }) {
  const t = useTranslations("discover");
  const locale = useLocale() as AppLocale;
  const text = usePreviewText(goal.isPreview);

  const title = text(goal.title);
  const description = text(goal.description);
  const imageAlt = text(goal.imageAlt);
  const creatorName = goal.creatorName || t("goalCard.creatorFallback");
  const raised = formatMinorAmount(goal.raisedMinor, goal.currency, locale);
  const target = formatMinorAmount(goal.targetMinor, goal.currency, locale);
  const category = goal.category
    ? t(categoryLabelKey(goal.category) as never)
    : null;
  const place = text(goal.location) ?? text(goal.country);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-stone bg-white">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-mist">
        {goal.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={goal.imageSrc}
            alt={imageAlt}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-forest to-forest-dark" />
        )}
        {goal.isPreview ? (
          <ExampleBadge label="Preview" className="absolute left-3 top-3" />
        ) : null}
        {category ? (
          <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-forest">
            {category}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-semibold text-forest">
          {title}
        </h3>
        <p className="mt-0.5 text-sm text-ink/70">
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
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink/75">
            {description}
          </p>
        ) : (
          <div className="flex-1" />
        )}
        <div className="mt-4 flex items-baseline justify-between text-sm">
          <span className="font-semibold text-forest">
            {goal.started
              ? t("goalCard.raisedOfTarget", { raised, target })
              : t("goalCard.targetGoal", { target })}
          </span>
          <span className="shrink-0 font-semibold text-gold-deep">
            {goal.started
              ? formatPercent(goal.percent, locale)
              : t("goalCard.beTheFirst")}
          </span>
        </div>
        <ProgressBar
          value={goal.percent}
          label={t("goalCard.progressLabel", { title, raised, target })}
          className="mt-2"
        />
        {goal.creatorHref ? (
          <Link
            href={goal.creatorHref}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-5 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            {t("goalCard.support")}
          </Link>
        ) : (
          <Link
            href="/how-it-works"
            className="mt-5 inline-flex items-center text-sm font-medium text-gold-deep hover:text-forest"
          >
            {t("goalCard.seeHowGoalsWork")}
            <span aria-hidden="true" className="ml-1">
              →
            </span>
          </Link>
        )}
      </div>
    </article>
  );
}
