import { useTranslations } from "next-intl";

type ExampleBadgeProps = {
  /** Honesty labels for fictional content (ADR-007) — semantic, translated here. */
  label?: "Example" | "Preview" | "Concept";
  /** Set when rendered on a deep-green panel. */
  tone?: "light" | "dark";
  className?: string;
};

const labelKeys = {
  Example: "badge.example",
  Preview: "badge.preview",
  Concept: "badge.concept",
} as const;

export function ExampleBadge({
  label = "Example",
  tone = "light",
  className,
}: ExampleBadgeProps) {
  const t = useTranslations("marketing");
  const colours =
    tone === "dark"
      ? "bg-white/15 text-white"
      : "bg-stone/60 text-ink/80";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${colours} ${className ?? ""}`}
    >
      {t(labelKeys[label])}
    </span>
  );
}
