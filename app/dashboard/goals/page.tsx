import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GoalManager } from "@/components/goals/goal-manager";
import { getOwnGoals } from "@/lib/goals/goals";
import type { CreatorGoalRow } from "@/lib/goals/types";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your goals",
  description: "Set the goals supporters can back on your page.",
  robots: { index: false, follow: false },
};

export default async function GoalsPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/sign-in?next=%2Fdashboard%2Fgoals");
  }

  let goals: CreatorGoalRow[] = [];
  let unavailable = false;
  try {
    goals = await getOwnGoals(user.id);
  } catch {
    unavailable = true;
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        Dashboard
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest sm:text-4xl">
        Goals
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/70">
        Goals turn support into a journey. Publish up to three at a time —
        progress comes from real Tees, never a number you type in.
      </p>

      <div className="mt-8">
        {unavailable ? (
          <div
            role="alert"
            className="rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/80"
          >
            Goals aren&apos;t available right now. Please try again shortly.
          </div>
        ) : (
          <GoalManager initialGoals={goals} />
        )}
      </div>
    </main>
  );
}
