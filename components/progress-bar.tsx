type ProgressBarProps = {
  /** 0–100 */
  value: number;
  /** Accessible name, e.g. "Progress towards Scotland Links Trip". */
  label: string;
  /** Set when rendered on a deep-green panel. */
  tone?: "light" | "dark";
  className?: string;
};

export function ProgressBar({
  value,
  label,
  tone = "light",
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const track = tone === "dark" ? "bg-white/20" : "bg-stone/60";
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label}
      className={`h-2 w-full overflow-hidden rounded-full ${track} ${className ?? ""}`}
    >
      <div
        className="h-full rounded-full bg-gold"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
