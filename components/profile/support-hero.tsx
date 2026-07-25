import { useLocale, useTranslations } from "next-intl";

import { ProgressBar } from "@/components/progress-bar";
import { SupportCta, type HeroGoal } from "@/components/profile/support-cta";
import type { AppLocale } from "@/i18n/locales";
import { goalProgressPercent, type CreatorGoalRow } from "@/lib/goals/types";
import { formatMinorAmount, formatPercent } from "@/lib/i18n/format";
import type { SupportedCurrency } from "@/lib/payments/currency";

const heroButtonClasses =
  "flex min-h-12 w-full items-center justify-center rounded-full bg-forest px-8 text-base font-medium text-white shadow-sm transition-colors hover:bg-forest-dark";

function toHeroGoal(goal: CreatorGoalRow): HeroGoal {
  return {
    id: goal.id,
    title: goal.title,
    raised: goal.raised_amount,
    target: goal.target_amount,
  };
}

/**
 * The conversion centrepiece near the top of a profile: the creator's leading
 * goal with its real progress, plus the primary "Buy a Tee" call to action so
 * a supporter sees what they'd back and how to help without scrolling.
 *
 * Honest by construction — progress comes from verified payments only, and the
 * CTA (with the sticky-bar sentinel id) appears solely when the creator can
 * actually receive Tees.
 */
export function SupportHero({
  name,
  goal,
  ready,
  currency,
}: {
  name: string;
  goal: CreatorGoalRow | null;
  ready: boolean;
  /** Payout currency — a goal only becomes the CTA target if it matches. */
  currency: SupportedCurrency;
}) {
  const t = useTranslations("profilePage.supportHero");
  const locale = useLocale() as AppLocale;

  if (!goal) {
    // Nothing to rally behind yet — still offer the primary action if possible.
    if (!ready) return null;
    return (
      <div className="mt-6">
        <SupportCta
          name={name}
          topGoal={null}
          id="support-cta-inline"
          className={heroButtonClasses}
        />
      </div>
    );
  }

  const percent = goalProgressPercent(goal.raised_amount, goal.target_amount);
  const target = formatMinorAmount(goal.target_amount, goal.currency, locale);
  const raised = formatMinorAmount(goal.raised_amount, goal.currency, locale);
  const started = goal.raised_amount > 0;

  return (
    <div className="mt-6 rounded-3xl border border-stone bg-mist p-5 sm:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gold-deep">
        {t("currentGoal")}
      </p>
      <h2 className="mt-1 font-serif text-lg font-semibold text-forest">
        {goal.title}
      </h2>
      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-forest">
            {started
              ? t("raisedOfTarget", { raised, target })
              : t("goalOnly", { target })}
          </p>
          <span className="shrink-0 text-sm font-semibold text-gold-deep">
            {started ? formatPercent(percent, locale) : t("beFirst")}
          </span>
        </div>
        <ProgressBar
          value={percent}
          label={t("progressLabel", { title: goal.title, raised, target })}
          className="mt-2"
        />
      </div>
      {ready ? (
        <div className="mt-5">
          <SupportCta
            name={name}
            topGoal={goal.currency === currency ? toHeroGoal(goal) : null}
            id="support-cta-inline"
            className={heroButtonClasses}
          />
        </div>
      ) : null}
    </div>
  );
}
