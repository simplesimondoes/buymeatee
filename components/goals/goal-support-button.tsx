"use client";

import { useTranslations } from "next-intl";

import {
  scrollToComposer,
  useSupportTarget,
} from "@/components/payments/support-target-context";

/**
 * "Support this goal" on a public goal card. Selects the goal as the composer's
 * target (carrying its progress so the composer can show it) and scrolls down,
 * so a supporter never has to hunt for the goal in a dropdown.
 */
export function GoalSupportButton({
  id,
  title,
  raised,
  target,
}: {
  id: string;
  title: string;
  raised: number;
  target: number;
}) {
  const t = useTranslations("dashboard");
  const { select } = useSupportTarget();
  return (
    <button
      type="button"
      onClick={() => {
        select({ kind: "goal", id, title, raised, target });
        scrollToComposer();
      }}
      className="inline-flex min-h-10 items-center justify-center rounded-full bg-forest px-5 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
    >
      {t("goals.supportButton")}
    </button>
  );
}
