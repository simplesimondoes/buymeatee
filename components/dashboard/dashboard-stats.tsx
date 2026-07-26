import { getTranslations } from "next-intl/server";

import { ProgressRing } from "@/components/ui/progress-ring";
import type { AppLocale } from "@/i18n/locales";
import { goalProgressPercent } from "@/lib/goals/types";

/**
 * The overview's at-a-glance stat row. Every number here is real, verified
 * data — supporters and journey posts the creator actually has, and the honest
 * progress of their top goal. Recurring support and profile views are shown as
 * clearly-labelled "coming soon" tiles (never invented figures), keeping the
 * dashboard feeling alive without overstating anything (spec #3 / CLAUDE.md).
 */

type TopGoal = { title: string; raised: number; target: number } | null;

function StatTile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-stone bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-gold-deep">
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function SoonTile({ label, note }: { label: string; note: string }) {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-dashed border-stone bg-mist p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
        {label}
      </p>
      <p className="mt-3 text-sm font-medium text-ink/60">{note}</p>
    </div>
  );
}

export async function DashboardStats({
  locale,
  supporters,
  journeyPosts,
  topGoal,
}: {
  locale: AppLocale;
  supporters: number;
  journeyPosts: number;
  topGoal: TopGoal;
}) {
  const t = await getTranslations({ locale, namespace: "dashboard" });
  const percent = topGoal
    ? goalProgressPercent(topGoal.raised, topGoal.target)
    : 0;

  return (
    <section
      aria-label={t("stats.sectionLabel")}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <StatTile label={t("stats.supporters")}>
        <p className="font-serif text-3xl font-semibold text-forest tabular-nums">
          {supporters}
        </p>
      </StatTile>

      <StatTile label={t("stats.journeyPosts")}>
        <p className="font-serif text-3xl font-semibold text-forest tabular-nums">
          {journeyPosts}
        </p>
      </StatTile>

      <StatTile label={t("stats.goalProgress")}>
        {topGoal ? (
          <div className="flex items-center gap-3">
            <ProgressRing
              value={percent}
              label={t("stats.goalProgressAria", { title: topGoal.title })}
              size={56}
              stroke={6}
            />
            <p className="min-w-0 truncate text-sm font-semibold text-forest">
              {topGoal.title}
            </p>
          </div>
        ) : (
          <p className="text-sm text-ink/60">{t("stats.noGoal")}</p>
        )}
      </StatTile>

      <SoonTile label={t("stats.recurring")} note={t("stats.comingSoon")} />
    </section>
  );
}
