export interface FunnelStage {
  label: string;
  count: number;
  /** Pre-formatted count (locale-aware). */
  formattedCount: string;
  /** Pre-formatted share of the first stage, e.g. "38%". */
  percentLabel: string | null;
}

/**
 * Horizontal funnel: each stage's bar length is its share of the first
 * stage. One hue — the length carries the data; exact numbers ride the row.
 */
export function FunnelBars({ stages }: { stages: FunnelStage[] }) {
  // Normalise widths by the largest stage, not blindly by the first: with
  // sparse early data a later stage can exceed stage one (e.g. a connected
  // account whose profile isn't role=creator), and bars must never hide a
  // real count.
  const base = Math.max(0, ...stages.map((stage) => stage.count));
  return (
    <ol className="space-y-4">
      {stages.map((stage) => {
        const share = base > 0 ? Math.min(stage.count / base, 1) : 0;
        return (
          <li key={stage.label}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-sm text-ink/80">{stage.label}</span>
              <span className="text-sm font-medium text-ink">
                {stage.formattedCount}
                {stage.percentLabel ? (
                  <span className="ml-1.5 font-normal text-ink/50">
                    ({stage.percentLabel})
                  </span>
                ) : null}
              </span>
            </div>
            <div
              aria-hidden
              className="mt-1.5 h-3 overflow-hidden rounded-full bg-stone/60"
            >
              <div
                className="h-full rounded-full bg-chart-green"
                style={{ width: `${share * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
