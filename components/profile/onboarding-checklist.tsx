import { Circle, CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import type { CreatorSetupState } from "@/lib/profile/setup-state";

/**
 * First-run guidance on the dashboard (issue #26): four steps computed from
 * live data — never stored booleans — so completing a step anywhere in the
 * app is reflected here immediately. Renders nothing once the journey is
 * fully set up; sharing is the hub's job from then on.
 *
 * Server-renderable: useTranslations resolves from the request config, so it
 * needs no client message namespace.
 */

interface Step {
  done: boolean;
  title: string;
  detail: string;
  href: string;
  action: string;
}

export function OnboardingChecklist({ state }: { state: CreatorSetupState }) {
  const t = useTranslations("settings");
  const { steps } = state;
  const items: Step[] = [
    {
      done: steps.claimedLink,
      title: t("checklist.steps.claimLink.title"),
      detail: t("checklist.steps.claimLink.detail"),
      href: "/settings/profile",
      action: t("checklist.steps.claimLink.action"),
    },
    {
      done: steps.profileComplete,
      title: t("checklist.steps.completeProfile.title"),
      detail: t("checklist.steps.completeProfile.detail"),
      href: "/settings/profile",
      action: t("checklist.steps.completeProfile.action"),
    },
    {
      done: steps.hasActiveGoal,
      title: t("checklist.steps.firstGoal.title"),
      detail: t("checklist.steps.firstGoal.detail"),
      href: "/dashboard/goals",
      action: t("checklist.steps.firstGoal.action"),
    },
    {
      done: steps.paymentsReady,
      title: t("checklist.steps.connectPayments.title"),
      detail: t("checklist.steps.connectPayments.detail"),
      href: "/settings/payments",
      action: t("checklist.steps.connectPayments.action"),
    },
  ];

  const remaining = items.filter((item) => !item.done).length;
  if (remaining === 0) {
    return null;
  }
  const doneCount = items.length - remaining;

  return (
    <section
      aria-label={t("checklist.aria")}
      className="rounded-3xl border border-gold/40 bg-gold/5 p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold text-forest">
          {t("checklist.title")}
        </h2>
        <p className="text-sm text-ink/70">
          {t("checklist.progress", { done: doneCount, total: items.length })}
        </p>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-ink/70">
        {t("checklist.intro")}
      </p>
      <ol className="mt-5 space-y-4">
        {items.map((item) => (
          <li key={item.title} className="flex items-start gap-3">
            {item.done ? (
              <CircleCheck
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-forest"
              />
            ) : (
              <Circle
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-stone"
              />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  item.done ? "text-ink/70 line-through" : "text-ink"
                }`}
              >
                {item.title}
                <span className="sr-only">
                  {" "}
                  {item.done ? t("checklist.stepDone") : t("checklist.stepTodo")}
                </span>
              </p>
              {!item.done ? (
                <p className="mt-0.5 text-sm text-ink/65">{item.detail}</p>
              ) : null}
            </div>
            {!item.done ? (
              <Link
                href={item.href}
                className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-forest/30 px-4 text-xs font-medium text-forest transition-colors hover:border-forest hover:bg-forest/5"
              >
                {item.action}
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
