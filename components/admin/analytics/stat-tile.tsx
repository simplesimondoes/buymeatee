import type { AppLocale } from "@/i18n/locales";

import { DeltaBadge } from "@/components/admin/analytics/delta-badge";

/** KPI tile: label, pre-formatted value, optional delta vs a named period. */
export function StatTile({
  label,
  value,
  delta,
  locale,
  noPriorLabel,
  hint,
}: {
  label: string;
  value: string;
  delta?: { changePercent: number | null; periodLabel: string };
  locale: AppLocale;
  noPriorLabel: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-stone bg-white p-5">
      <p className="text-sm text-ink/70">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-ink">{value}</p>
      {delta ? (
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <DeltaBadge
            changePercent={delta.changePercent}
            locale={locale}
            noPriorLabel={noPriorLabel}
          />
          <span className="text-xs text-ink/70">{delta.periodLabel}</span>
        </p>
      ) : null}
      {hint ? <p className="mt-1 text-xs text-ink/70">{hint}</p> : null}
    </div>
  );
}
