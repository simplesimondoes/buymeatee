import { TrendingDown, TrendingUp } from "lucide-react";

import type { AppLocale } from "@/i18n/locales";
import { formatSignedPercent } from "@/lib/i18n/format";

/**
 * Period-on-period delta. Direction colour follows "up is good" (every metric
 * on the analytics page grows the platform). A null change means the previous
 * window was empty — shown as an em dash, never a fake percentage.
 */
export function DeltaBadge({
  changePercent,
  locale,
  noPriorLabel,
}: {
  changePercent: number | null;
  locale: AppLocale;
  noPriorLabel: string;
}) {
  if (changePercent === null) {
    return (
      <span className="text-xs text-ink/50" title={noPriorLabel}>
        —
      </span>
    );
  }
  if (changePercent === 0) {
    return (
      <span className="text-xs font-medium text-ink/60">
        {formatSignedPercent(0, locale)}
      </span>
    );
  }
  const up = changePercent > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        up ? "text-forest" : "text-red-700"
      }`}
    >
      {up ? (
        <TrendingUp aria-hidden className="h-3.5 w-3.5" />
      ) : (
        <TrendingDown aria-hidden className="h-3.5 w-3.5" />
      )}
      {formatSignedPercent(changePercent, locale)}
    </span>
  );
}
