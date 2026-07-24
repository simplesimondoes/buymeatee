import { ProgressBar } from "@/components/progress-bar";
import { goalProgressPercent, type CreatorGoalRow } from "@/lib/goals/types";
import { formatMinorAmount } from "@/lib/payments/currency";

/**
 * The conversion centrepiece near the top of a profile: the creator's leading
 * goal with its real progress, plus the primary "Buy a Tee" call to action so
 * a supporter sees what they'd back and how to help without scrolling.
 *
 * Honest by construction — progress comes from verified payments only, and the
 * CTA (with the sticky-bar sentinel id) appears solely when the creator can
 * actually receive Tees.
 */
export function SupportHero({
  name,
  goal,
  ready,
}: {
  name: string;
  goal: CreatorGoalRow | null;
  ready: boolean;
}) {
  if (!goal) {
    // Nothing to rally behind yet — still offer the primary action if possible.
    if (!ready) return null;
    return (
      <div className="mt-6">
        <SupportButton name={name} />
      </div>
    );
  }

  const percent = goalProgressPercent(goal.raised_amount, goal.target_amount);
  const target = formatMinorAmount(goal.target_amount, goal.currency);
  const raised = formatMinorAmount(goal.raised_amount, goal.currency);
  const started = goal.raised_amount > 0;

  return (
    <div className="mt-6 rounded-3xl border border-stone bg-mist p-5 sm:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gold-deep">
        Current goal
      </p>
      <h2 className="mt-1 font-serif text-lg font-semibold text-forest">
        {goal.title}
      </h2>
      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-forest">
            {started ? `${raised} of ${target}` : `${target} goal`}
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
      </div>
      {ready ? (
        <div className="mt-5">
          <SupportButton name={name} />
        </div>
      ) : null}
    </div>
  );
}

function SupportButton({ name }: { name: string }) {
  return (
    <a
      id="support-cta-inline"
      href="#support"
      className="flex min-h-12 w-full items-center justify-center rounded-full bg-forest px-8 text-base font-medium text-white shadow-sm transition-colors hover:bg-forest-dark"
    >
      Buy {name} a Tee
    </a>
  );
}
