"use client";

import {
  scrollToComposer,
  useSupportTarget,
} from "@/components/payments/support-target-context";

/**
 * The primary support call-to-action used by the hero and the sticky bar. When
 * the creator has a leading goal it reads "Support this goal" and pre-selects
 * that goal in the composer; otherwise it's the general "Buy a tee". Either way
 * it scrolls to the composer, so the button's words match what happens next.
 */
export type HeroGoal = {
  id: string;
  title: string;
  raised: number;
  target: number;
};

export function SupportCta({
  name,
  topGoal,
  id,
  className,
  tabIndex,
}: {
  name: string;
  topGoal: HeroGoal | null;
  /** Sentinel id the sticky bar observes; set only on the in-page hero button. */
  id?: string;
  className: string;
  tabIndex?: number;
}) {
  const { select, clear } = useSupportTarget();
  return (
    <button
      type="button"
      id={id}
      tabIndex={tabIndex}
      onClick={() => {
        if (topGoal) {
          select({ kind: "goal", ...topGoal });
        } else {
          clear();
        }
        scrollToComposer();
      }}
      className={className}
    >
      {topGoal ? "Support this goal" : `Buy ${name} a tee`}
    </button>
  );
}
