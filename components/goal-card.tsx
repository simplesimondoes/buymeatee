import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

import { ExampleBadge } from "@/components/example-badge";
import { ProgressBar } from "@/components/progress-bar";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/locales";
import { goalProgress, type ExampleGoal } from "@/lib/content/example-goals";
import { formatMinorAmount, formatPercent } from "@/lib/i18n/format";

/**
 * Card for a labelled Example goal. Title/creator/description arrive already
 * translated from the section that renders it; amounts are major-unit GBP
 * from the example data and formatted per locale.
 */
export function GoalCard({ goal }: { goal: ExampleGoal }) {
  const t = useTranslations("marketing");
  const tContent = useTranslations("content");
  const locale = useLocale() as AppLocale;
  const progress = goalProgress(goal);
  const alt = goal.image.altKey
    ? tContent(goal.image.altKey as Parameters<typeof tContent>[0])
    : goal.image.alt;
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-stone bg-white">
      <div className="relative">
        <Image
          src={goal.image.src}
          alt={alt}
          width={goal.image.width}
          height={goal.image.height}
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
          className="h-44 w-full object-cover"
        />
        <ExampleBadge className="absolute left-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-semibold text-forest">
          {goal.title}
        </h3>
        <p className="text-sm text-ink/70">{goal.creator}</p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/75">
          {goal.description}
        </p>
        <div className="mt-4 flex items-baseline justify-between text-sm">
          <span className="font-semibold text-forest">
            {t("goalCard.raisedOfTarget", {
              raised: formatMinorAmount(goal.raised * 100, "gbp", locale, {
                trimWholeAmounts: true,
              }),
              target: formatMinorAmount(goal.target * 100, "gbp", locale, {
                trimWholeAmounts: true,
              }),
            })}
          </span>
          <span className="text-ink/70">{formatPercent(progress, locale)}</span>
        </div>
        <ProgressBar
          value={progress}
          label={t("goalCard.progressLabel", { title: goal.title })}
          className="mt-2"
        />
        <Link
          href="/how-it-works"
          className="mt-5 inline-flex items-center text-sm font-medium text-gold-deep hover:text-forest"
        >
          {t("goalCard.seeHow")}
          <span aria-hidden="true" className="ml-1">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
