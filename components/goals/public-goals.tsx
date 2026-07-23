import { CircleCheck } from "lucide-react";
import Link from "next/link";

import { ProgressBar } from "@/components/progress-bar";
import {
  goalProgressPercent,
  type CreatorGoalRow,
} from "@/lib/goals/types";
import { formatMinorAmount } from "@/lib/payments/currency";

/**
 * A creator's goals as supporters see them. Server-rendered, honest by
 * construction: raised amounts come from verified payments only, a fresh
 * goal says so instead of faking momentum, and over-target goals show
 * their real total.
 */

function PublicGoalCard({ goal }: { goal: CreatorGoalRow }) {
  const percent = goalProgressPercent(goal.raised_amount, goal.target_amount);
  const target = formatMinorAmount(goal.target_amount, goal.currency);
  const raised = formatMinorAmount(goal.raised_amount, goal.currency);
  const overTarget = goal.raised_amount > goal.target_amount;

  return (
    <article className="rounded-3xl border border-stone bg-white p-5 sm:p-6">
      <h3 className="font-serif text-lg font-semibold text-forest">
        {goal.title}
      </h3>
      {goal.description ? (
        <p className="mt-1 text-sm leading-relaxed text-ink/75">
          {goal.description}
        </p>
      ) : null}
      <div className="mt-4">
        {goal.raised_amount === 0 ? (
          <p className="text-sm text-ink/70">
            <span className="font-semibold text-forest">{target} goal</span>
            <span className="mx-1.5" aria-hidden="true">
              ·
            </span>
            Just getting started — be the first to back it.
          </p>
        ) : (
          <p className="text-sm font-semibold text-forest">
            {raised} of {target} raised
            {overTarget ? (
              <span className="ml-1.5 font-normal text-gold-deep">
                — beyond the goal!
              </span>
            ) : null}
          </p>
        )}
        <ProgressBar
          value={percent}
          label={`Progress towards ${goal.title}: ${raised} of ${target} raised`}
          className="mt-2"
        />
      </div>
    </article>
  );
}

export function PublicGoals({
  active,
  completed,
  creatorName,
  isOwner,
}: {
  active: CreatorGoalRow[];
  completed: CreatorGoalRow[];
  creatorName: string;
  isOwner: boolean;
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
            <PublicGoalCard key={goal.id} goal={goal} />
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
