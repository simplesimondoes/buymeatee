/**
 * Server-rendered line chart (admin analytics). Dependency-free, like the
 * rest of the analytics charts: 2px round-joined lines, ≥8px markers with a
 * 2px surface ring so points stay legible where lines cross, a ~10% area
 * wash for single-series charts, hairline gridlines and native <title>
 * hover tooltips. Every chart on the page is paired with a table, so exact
 * values are never gated behind the graphic.
 *
 * Wide series keep a minimum width and scroll horizontally on small screens
 * instead of shrinking below legibility.
 */

export interface LineChartSeries {
  name: string;
  /** CSS custom property carrying the mark colour, e.g. "--color-chart-green". */
  colorVar: string;
}

export interface LineChartPoint {
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
const MARKER_RADIUS = 4.5;

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

export function LineChart({
  title,
  points,
  series,
  formatValue,
  labelEvery = 1,
}: {
  /** Accessible name; also the hover context. */
  title: string;
  points: LineChartPoint[];
  series: LineChartSeries[];
  /** Formats raw values for axis ticks and tooltips (e.g. minor units → £). */
  formatValue: (value: number) => string;
  /** Show every nth x-axis label (dense daily charts pass 5). */
  labelEvery?: number;
}) {
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const baseline = PAD_TOP + plotHeight;

  const max = niceMax(
    Math.max(0, ...points.flatMap((point) => point.values)),
  );
  const midTick = max / 2;
  const ticks = Number.isInteger(midTick) ? [0, midTick, max] : [0, max];

  const slot = plotWidth / Math.max(points.length, 1);
  const x = (index: number) => PAD_LEFT + (index + 0.5) * slot;
  const y = (value: number) => baseline - (value / max) * plotHeight;

  const linePath = (seriesIndex: number) =>
    points
      .map(
        (point, i) =>
          `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(point.values[seriesIndex] ?? 0).toFixed(2)}`,
      )
      .join(" ");

  return (
    <figure className="m-0">
      {series.length > 1 ? (
        <figcaption className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s, si) => (
            <span
              key={s.name}
              className="inline-flex items-center gap-1.5 text-xs text-ink/70"
            >
              {/* The legend key mirrors the line style: solid vs dashed. */}
              <span
                aria-hidden
                className="w-4"
                style={
                  si > 0
                    ? { borderTop: `2px dashed var(${s.colorVar})` }
                    : { borderTop: `2px solid var(${s.colorVar})` }
                }
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
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--color-stone)"
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 8}
                y={y(tick) + 4}
                textAnchor="end"
                fontSize={11}
                fill="var(--color-ink)"
                opacity={0.55}
              >
                {formatValue(tick)}
              </text>
            </g>
          ))}

          {/* Area wash for a single series only — a wash under two lines
              obscures which region belongs to which. */}
          {series.length === 1 && points.length > 1 ? (
            <path
              d={`${linePath(0)} L ${x(points.length - 1).toFixed(2)} ${baseline} L ${x(0).toFixed(2)} ${baseline} Z`}
              fill={`var(${series[0].colorVar})`}
              opacity={0.1}
            />
          ) : null}

          {series.map((s, si) =>
            points.length > 1 ? (
              <path
                key={s.name}
                d={linePath(si)}
                fill="none"
                stroke={`var(${s.colorVar})`}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                // Dash every series after the first: early-stage series often
                // sit at identical values (e.g. both at 0), and without a
                // line-style difference the top line completely hides the one
                // beneath it. Doubles as a colour-independent identity cue.
                strokeDasharray={si > 0 ? "6 5" : undefined}
              />
            ) : null,
          )}

          {points.map((point, i) => (
            <g key={point.key}>
              <title>
                {[
                  point.label,
                  ...series.map(
                    (s, si) => `${s.name}: ${formatValue(point.values[si] ?? 0)}`,
                  ),
                ].join("\n")}
              </title>
              {/* Full-slot invisible hit target so hover works between markers. */}
              <rect
                x={PAD_LEFT + i * slot}
                y={PAD_TOP}
                width={slot}
                height={plotHeight}
                fill="transparent"
              />
              {series.map((s, si) => (
                <circle
                  key={s.name}
                  cx={x(i)}
                  cy={y(point.values[si] ?? 0)}
                  r={MARKER_RADIUS}
                  fill={`var(${s.colorVar})`}
                  stroke="var(--color-white)"
                  strokeWidth={2}
                />
              ))}
              {i % labelEvery === 0 ? (
                <text
                  x={x(i)}
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
          ))}

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
