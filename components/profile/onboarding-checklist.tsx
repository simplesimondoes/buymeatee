import { Circle, CircleCheck } from "lucide-react";
import Link from "next/link";

import type { CreatorSetupState } from "@/lib/profile/setup-state";

/**
 * First-run guidance on the dashboard (issue #26): four steps computed from
 * live data — never stored booleans — so completing a step anywhere in the
 * app is reflected here immediately. Renders nothing once the journey is
 * fully set up; sharing is the hub's job from then on.
 */

interface Step {
  done: boolean;
  title: string;
  detail: string;
  href: string;
  action: string;
}

export function OnboardingChecklist({ state }: { state: CreatorSetupState }) {
  const { steps } = state;
  const items: Step[] = [
    {
      done: steps.claimedLink,
      title: "Claim your link",
      detail: "Pick the buymeatee.com/t/ name supporters will visit.",
      href: "/settings/profile",
      action: "Choose a link",
    },
    {
      done: steps.profileComplete,
      title: "Complete your profile",
      detail: "A name plus a bio or photo — who's behind the journey.",
      href: "/settings/profile",
      action: "Edit profile",
    },
    {
      done: steps.hasActiveGoal,
      title: "Publish your first goal",
      detail: "Give supporters something real to get behind.",
      href: "/dashboard/goals",
      action: "Add a goal",
    },
    {
      done: steps.paymentsReady,
      title: "Connect payments",
      detail: "Stripe handles the money — Tees go straight to you.",
      href: "/settings/payments",
      action: "Set up payments",
    },
  ];

  const remaining = items.filter((item) => !item.done).length;
  if (remaining === 0) {
    return null;
  }
  const doneCount = items.length - remaining;

  return (
    <section
      aria-label="Getting started"
      className="rounded-3xl border border-gold/40 bg-gold/5 p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold text-forest">
          Set up your journey
        </h2>
        <p className="text-sm text-ink/60">
          {doneCount} of {items.length} done
        </p>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-ink/70">
        A few steps and supporters can buy you a tee.
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
                  item.done ? "text-ink/50 line-through" : "text-ink"
                }`}
              >
                {item.title}
                <span className="sr-only">
                  {item.done ? " — done" : " — to do"}
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
