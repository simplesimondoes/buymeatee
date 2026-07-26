/**
 * A circular progress indicator — the premium counterpart to <ProgressBar>.
 * Pure SVG (no dependency), accessible (role="progressbar" with aria values),
 * and theme-token driven (gold arc on a stone track). Used in the profile
 * header and dashboard to make a goal's honest progress feel like a fitness
 * ring rather than a fundraiser bar.
 */

type ProgressRingProps = {
  /** 0–100. Callers pass the capped whole-percent from goalProgressPercent. */
  value: number;
  /** Accessible name, e.g. "Progress towards Scotland Links Trip". */
  label: string;
  /** Diameter in px. */
  size?: number;
  /** Stroke width in px. */
  stroke?: number;
  /** Deep-green panels flip the track to a translucent white. */
  tone?: "light" | "dark";
  /** Centre label; defaults to the whole percent. Pass null to hide it. */
  children?: React.ReactNode;
  className?: string;
};

export function ProgressRing({
  value,
  label,
  size = 96,
  stroke = 8,
  tone = "light",
  children,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const track = tone === "dark" ? "text-white/20" : "text-stone";
  const centre = tone === "dark" ? "text-white" : "text-forest";

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label}
      className={`relative inline-flex items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={track}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="text-gold [transition:stroke-dashoffset_600ms_ease] motion-reduce:transition-none"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
        />
      </svg>
      {children !== null ? (
        <span
          className={`absolute inset-0 flex items-center justify-center text-sm font-semibold ${centre}`}
        >
          {children ?? `${clamped}%`}
        </span>
      ) : null}
    </div>
  );
}
