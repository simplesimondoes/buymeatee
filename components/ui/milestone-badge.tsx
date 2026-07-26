import { Flag, Trophy } from "lucide-react";

/**
 * A premium badge for milestone Journey posts and the "latest milestone" chip
 * in the profile header. Deliberately tasteful (no gamification, per spec #6):
 * a gold-bordered pill with an icon and the milestone label. The label text is
 * supplied already localised/honest by the caller.
 */

export function MilestoneBadge({
  label,
  tone = "light",
  size = "md",
}: {
  label: string;
  tone?: "light" | "dark";
  /** 100% goals get the trophy; other milestones a flag. */
  size?: "sm" | "md";
}) {
  const Icon = /100/.test(label) ? Trophy : Flag;
  const base =
    tone === "dark"
      ? "border-gold/60 bg-white/10 text-white"
      : "border-gold bg-gold/10 text-gold-deep";
  const dims = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${base} ${dims}`}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
