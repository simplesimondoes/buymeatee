/**
 * Server-rendered stacked bar chart (admin analytics). Deliberately
 * dependency-free: a responsive SVG with hairline gridlines, ≤24px bars with
 * a 4px rounded data-end, a 2px surface gap between stacked segments and
 * native <title> hover tooltips. Every chart on the page is paired with a
 * table, so exact values are never gated behind the graphic.
 *
 * Wide series (30 daily bars) keep a minimum width and scroll horizontally
 * on small screens instead of shrinking below legibility.
 */

export interface BarChartSeries {
  name: string;
  /** CSS custom property carrying the mark colour, e.g. "--color-chart-green". */
  colorVar: string;
}

export interface BarChartPoint {
  key: string;
  /** Localized x-axis / tooltip label. */
  label: string;
  /** One value per series, same order as `series`. */
  values: number[];
}

const WIDTH = 720;
const HEIGHT = 220;
const PAD_LEFT = 56;
const PAD_RIGHT = 8;
const PAD_TOP = 10;
const PAD_BOTTOM = 26;
const MAX_BAR_WIDTH = 24;
const SEGMENT_GAP = 2;
const CORNER = 4;

/** Round up to a clean axis maximum: 1/2/5 × 10^k. */
function niceMax(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const base = 10 ** Math.floor(Math.log10(value));
  for (const multiplier of [1, 2, 5, 10]) {
    if (value <= multiplier * base) {
      return multiplier * base;
    }
  }
  return 10 * base;
}

/** Rect with a 4px rounded top (data end) and a square baseline end. */
function roundedTopRect(
  x: number,
  y: number,
  width: number,
  height: number,
): string {
  const r = Math.min(CORNER, height, width / 2);
  return [
    `M ${x} ${y + height}`,
    `V ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `H ${x + width - r}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `V ${y + height}`,
    "Z",
  ].join(" ");
}

export function BarChart({
  title,
  points,
  series,
  formatValue,
  labelEvery = 1,
}: {
  /** Accessible name; also the hover context. */
  title: string;
  points: BarChartPoint[];
  series: BarChartSeries[];
  /** Formats raw values for axis ticks and tooltips (e.g. minor units → £). */
  formatValue: (value: number) => string;
  /** Show every nth x-axis label (dense daily charts pass 5). */
  labelEvery?: number;
}) {
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const baseline = PAD_TOP + plotHeight;

  const stackTotals = points.map((point) =>
    point.values.reduce((sum, v) => sum + v, 0),
  );
  const max = niceMax(Math.max(0, ...stackTotals));
  const midTick = max / 2;
  const ticks = Number.isInteger(midTick) ? [0, midTick, max] : [0, max];

  const slot = plotWidth / Math.max(points.length, 1);
  const barWidth = Math.min(MAX_BAR_WIDTH, slot * 0.72);
  const scale = (value: number) => (value / max) * plotHeight;

  return (
    <figure className="m-0">
      {series.length > 1 ? (
        <figcaption className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s) => (
            <span
              key={s.name}
              className="inline-flex items-center gap-1.5 text-xs text-ink/70"
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: `var(${s.colorVar})` }}
              />
              {s.name}
            </span>
          ))}
        </figcaption>
      ) : null}
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label={title}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full min-w-[540px]"
        >
          {ticks.map((tick) => {
            const y = baseline - scale(tick);
            return (
              <g key={tick}>
                <line
                  x1={PAD_LEFT}
                  x2={WIDTH - PAD_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="var(--color-stone)"
                  strokeWidth={1}
                />
                <text
                  x={PAD_LEFT - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill="var(--color-ink)"
                  opacity={0.55}
                >
                  {formatValue(tick)}
                </text>
              </g>
            );
          })}

          {points.map((point, i) => {
            const x = PAD_LEFT + i * slot + (slot - barWidth) / 2;
            const tooltip = [
              point.label,
              ...series.map(
                (s, si) => `${s.name}: ${formatValue(point.values[si] ?? 0)}`,
              ),
            ].join("\n");

            // Stack bottom-up; the 2px surface gap is carved out of the upper
            // segment so the stack's total height stays true to the axis.
            let cursor = baseline;
            const segments = point.values.map((value, si) => {
              const height = scale(value);
              const y = cursor - height;
              const gap =
                si > 0 && height > 0 && cursor < baseline ? SEGMENT_GAP : 0;
              if (height > 0) {
                cursor = y;
              }
              return { si, y, height: Math.max(height - gap, 0) };
            });
            const topIndex = [...segments]
              .reverse()
              .find((seg) => seg.height > 0)?.si;

            return (
              <g key={point.key}>
                <title>{tooltip}</title>
                {/* Full-slot invisible hit target so hover works on thin bars. */}
                <rect
                  x={PAD_LEFT + i * slot}
                  y={PAD_TOP}
                  width={slot}
                  height={plotHeight}
                  fill="transparent"
                />
                {segments.map((seg) =>
                  seg.height <= 0 ? null : seg.si === topIndex ? (
                    <path
                      key={seg.si}
                      d={roundedTopRect(x, seg.y, barWidth, seg.height)}
                      fill={`var(${series[seg.si].colorVar})`}
                    />
                  ) : (
                    <rect
                      key={seg.si}
                      x={x}
                      y={seg.y}
                      width={barWidth}
                      height={seg.height}
                      fill={`var(${series[seg.si].colorVar})`}
                    />
                  ),
                )}
                {i % labelEvery === 0 ? (
                  <text
                    x={PAD_LEFT + i * slot + slot / 2}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                    fontSize={11}
                    fill="var(--color-ink)"
                    opacity={0.55}
                  >
                    {point.label}
                  </text>
                ) : null}
              </g>
            );
          })}

          <line
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT}
            y1={baseline}
            y2={baseline}
            stroke="var(--color-stone)"
            strokeWidth={1}
          />
        </svg>
      </div>
    </figure>
  );
}
