import { CircleCheck } from "lucide-react";
import Link from "next/link";

import { GoalSupportButton } from "@/components/goals/goal-support-button";
import { ProgressBar } from "@/components/progress-bar";
import {
  goalProgressPercent,
  type CreatorGoalRow,
} from "@/lib/goals/types";
import { formatMinorAmount, type SupportedCurrency } from "@/lib/payments/currency";

/**
 * A creator's goals as supporters see them. Server-rendered, honest by
 * construction: raised amounts come from verified payments only, a fresh
 * goal says so instead of faking momentum, and over-target goals show
 * their real total.
 */

function PublicGoalCard({
  goal,
  supporters,
  fundable,
}: {
  goal: CreatorGoalRow;
  supporters: number;
  /** Creator can receive Tees AND the goal is in their payout currency. */
  fundable: boolean;
}) {
  const percent = goalProgressPercent(goal.raised_amount, goal.target_amount);
  const target = formatMinorAmount(goal.target_amount, goal.currency);
  const raised = formatMinorAmount(goal.raised_amount, goal.currency);
  const overTarget = goal.raised_amount > goal.target_amount;
  const started = goal.raised_amount > 0;

  return (
    <article className="overflow-hidden rounded-3xl border border-stone bg-white">
      {goal.cover_image_url ? (
        <div className="aspect-[16/9] w-full overflow-hidden bg-mist">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={goal.cover_image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="p-5 sm:p-6">
        <h3 className="font-serif text-lg font-semibold text-forest">
          {goal.title}
        </h3>
        {goal.description ? (
          <p className="mt-1 text-sm leading-relaxed text-ink/75">
            {goal.description}
          </p>
        ) : null}
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-forest">
              {started ? `${raised} of ${target}` : `${target} goal`}
              {overTarget ? (
                <span className="ml-1.5 font-normal text-gold-deep">
                  — beyond the goal!
                </span>
              ) : null}
            </p>
            <span className="shrink-0 text-sm font-semibold text-gold-deep">
              {started ? `${percent}%` : "Be the first"}
            </span>
          </div>
          <ProgressBar
            value={percent}
            label={`Progress towards ${goal.title}: ${raised} of ${target} raised`}
            className="mt-2"
          />
          {!started ? (
            <p className="mt-2 text-xs text-ink/60">
              Just getting started — be the first to back it.
            </p>
          ) : supporters > 0 ? (
            <p className="mt-2 text-xs text-ink/60">
              Supported by {supporters} {supporters === 1 ? "golfer" : "golfers"}
            </p>
          ) : null}
        </div>
        {fundable ? (
          <div className="mt-5">
            <GoalSupportButton
              id={goal.id}
              title={goal.title}
              raised={goal.raised_amount}
              target={goal.target_amount}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function PublicGoals({
  active,
  completed,
  creatorName,
  isOwner,
  ready,
  currency,
  supportersByGoal = {},
}: {
  active: CreatorGoalRow[];
  completed: CreatorGoalRow[];
  creatorName: string;
  isOwner: boolean;
  /** Creator can receive Tees — gates the per-goal "Support this goal" button. */
  ready: boolean;
  /** Creator's payout currency; a goal must match it to be fundable. */
  currency: SupportedCurrency;
  supportersByGoal?: Record<string, number>;
}) {
  if (active.length === 0 && completed.length === 0) {
    if (!isOwner) {
      return null;
    }
    return (
      <section aria-label="Goals" className="rounded-3xl border border-dashed border-stone bg-mist p-6 text-center">
        <p className="text-sm leading-relaxed text-ink/70">
          Your page has no goals yet. Goals give supporters something real to
          get behind.
        </p>
        <Link
          href="/dashboard/goals"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-forest/30 px-5 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-forest/5"
        >
          Add your first goal
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="Goals" className="space-y-4">
      {active.length > 0 ? (
        <>
          <h2 className="font-serif text-xl font-semibold text-forest">
            {creatorName}&apos;s goals
          </h2>
          {active.map((goal) => (
            <PublicGoalCard
              key={goal.id}
              goal={goal}
              supporters={supportersByGoal[goal.id] ?? 0}
              fundable={ready && goal.currency === currency}
            />
          ))}
        </>
      ) : null}

      {completed.length > 0 ? (
        <div className="rounded-3xl border border-stone bg-mist p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gold-deep">
            Made possible by supporters
          </h2>
          <ul className="mt-3 space-y-2">
            {completed.map((goal) => (
              <li key={goal.id} className="flex items-center gap-2 text-sm text-ink/80">
                <CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-forest" />
                <span>
                  {goal.title}
                  <span className="text-ink/60">
                    {" "}
                    — {formatMinorAmount(goal.raised_amount, goal.currency)} raised
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {isOwner && active.length === 0 ? (
        <p className="text-sm text-ink/60">
          No active goals right now —{" "}
          <Link href="/dashboard/goals" className="font-medium text-forest underline underline-offset-2">
            publish one
          </Link>{" "}
          to give supporters something to back.
        </p>
      ) : null}
    </section>
  );
}
