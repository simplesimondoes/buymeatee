type ExampleBadgeProps = {
  /** Honesty labels for fictional content (ADR-007). */
  label?: "Example" | "Preview" | "Concept";
  /** Set when rendered on a deep-green panel. */
  tone?: "light" | "dark";
  className?: string;
};

export function ExampleBadge({
  label = "Example",
  tone = "light",
  className,
}: ExampleBadgeProps) {
  const colours =
    tone === "dark"
      ? "bg-cream/15 text-cream"
      : "bg-stone/60 text-ink/80";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${colours} ${className ?? ""}`}
    >
      {label}
    </span>
  );
}
