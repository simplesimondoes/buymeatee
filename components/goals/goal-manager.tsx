"use client";

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useState } from "react";

import { GoalForm, type GoalFormErrors } from "@/components/goals/goal-form";
import { ProgressBar } from "@/components/progress-bar";
import type { GoalInput } from "@/lib/goals/goal-schema";
import {
  goalProgressPercent,
  MAX_ACTIVE_GOALS,
  type CreatorGoalRow,
  type GoalStatus,
} from "@/lib/goals/types";
import { formatMinorAmount } from "@/lib/payments/currency";

/**
 * The creator's goal list: create, edit, reorder and move goals through
 * their lifecycle. The server owns every rule (limits, transitions,
 * currency freeze) — this component just reflects its answers.
 */

const statusChips: Record<GoalStatus, { label: string; classes: string }> = {
  draft: { label: "Draft", classes: "bg-mist text-ink/70" },
  active: { label: "On your page", classes: "bg-forest/10 text-forest" },
  completed: { label: "Completed", classes: "bg-gold/20 text-gold-deep" },
  archived: { label: "Archived", classes: "bg-stone/60 text-ink/60" },
};

type Transition = { to: GoalStatus; label: string; emphasis?: boolean };

const transitionsFor: Record<GoalStatus, Transition[]> = {
  draft: [{ to: "active", label: "Publish to your page", emphasis: true }],
  active: [
    { to: "completed", label: "Mark completed", emphasis: true },
    { to: "draft", label: "Take off your page" },
  ],
  completed: [{ to: "active", label: "Reopen" }],
  archived: [{ to: "draft", label: "Restore as draft" }],
};

const secondaryButton =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-stone px-3.5 text-xs font-medium text-ink/70 transition-colors hover:border-forest/40 hover:text-forest disabled:opacity-60";

async function postGoalAction(
  goalId: string,
  body: Record<string, unknown>,
): Promise<{ goal?: CreatorGoalRow; errors?: GoalFormErrors; error?: string }> {
  try {
    const response = await fetch(`/api/goals/${goalId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json().catch(() => ({}))) as {
      goal?: CreatorGoalRow;
      errors?: GoalFormErrors;
      error?: string;
    };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export function GoalManager({ initialGoals }: { initialGoals: CreatorGoalRow[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const activeCount = goals.filter((goal) => goal.status === "active").length;

  function replaceGoal(updated: CreatorGoalRow) {
    setGoals((current) =>
      current.map((goal) => (goal.id === updated.id ? updated : goal)),
    );
  }

  async function handleCreate(input: GoalInput) {
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = (await response.json().catch(() => ({}))) as {
        goal?: CreatorGoalRow;
        errors?: GoalFormErrors;
        error?: string;
      };
      if (response.ok && body.goal) {
        setGoals((current) => [...current, body.goal as CreatorGoalRow]);
        setCreating(false);
        return null;
      }
      return { errors: body.errors, error: body.error };
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
  }

  async function handleEdit(goalId: string, input: GoalInput) {
    const body = await postGoalAction(goalId, { action: "edit", ...input });
    if (body.goal) {
      replaceGoal(body.goal);
      setEditingId(null);
      return null;
    }
    return { errors: body.errors, error: body.error };
  }

  async function handleTransition(goalId: string, to: GoalStatus) {
    setActionError(null);
    setBusyId(goalId);
    const body = await postGoalAction(goalId, { action: "transition", to });
    setBusyId(null);
    if (body.goal) {
      replaceGoal(body.goal);
    } else {
      setActionError(body.error ?? "Something went wrong. Please try again.");
    }
  }

  async function handleMove(goalId: string, direction: "up" | "down") {
    setActionError(null);
    const index = goals.findIndex((goal) => goal.id === goalId);
    const neighbourIndex = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || !goals[neighbourIndex]) {
      return;
    }
    setBusyId(goalId);
    const body = await postGoalAction(goalId, { action: "move", direction });
    setBusyId(null);
    if (body.error) {
      setActionError(body.error);
      return;
    }
    setGoals((current) => {
      const next = [...current];
      [next[index], next[neighbourIndex]] = [next[neighbourIndex], next[index]];
      return next;
    });
  }

  async function handleDelete(goalId: string) {
    setActionError(null);
    setBusyId(goalId);
    try {
      const response = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
      if (response.ok) {
        setGoals((current) => current.filter((goal) => goal.id !== goalId));
      } else {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setActionError(body.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
    setBusyId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink/70">
          {activeCount} of {MAX_ACTIVE_GOALS} active goals on your page
        </p>
        {!creating ? (
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setEditingId(null);
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New goal
          </button>
        ) : null}
      </div>

      {actionError ? (
        <p role="alert" className="text-sm text-red-800">
          {actionError}
        </p>
      ) : null}

      {creating ? (
        <div className="rounded-3xl border border-stone bg-white p-6">
          <h2 className="mb-4 font-serif text-lg font-semibold text-forest">
            New goal
          </h2>
          <GoalForm
            submitLabel="Save goal"
            onCancel={() => setCreating(false)}
            onSubmit={handleCreate}
          />
        </div>
      ) : null}

      {goals.length === 0 && !creating ? (
        <div className="rounded-3xl border border-stone bg-mist p-6 text-center sm:p-10">
          <h2 className="font-serif text-xl font-semibold text-forest">
            What&apos;s your journey working towards?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
            Good goals are specific and real: a season of green fees, travel to
            a qualifier, tournament entries, a coaching block. For instance
            &ldquo;Q-School entry fee — £425&rdquo; <em>(Example)</em>. Goals
            you publish appear on your page with honest progress.
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add your first goal
          </button>
        </div>
      ) : null}

      <ul className="space-y-4">
        {goals.map((goal, index) => {
          const chip = statusChips[goal.status];
          const busy = busyId === goal.id;
          return (
            <li
              key={goal.id}
              className="rounded-3xl border border-stone bg-white p-5 sm:p-6"
            >
              {editingId === goal.id ? (
                <GoalForm
                  initialTitle={goal.title}
                  initialDescription={goal.description ?? ""}
                  initialCurrency={goal.currency}
                  initialTargetAmount={goal.target_amount}
                  currencyLocked={goal.raised_amount > 0}
                  submitLabel="Save changes"
                  onCancel={() => setEditingId(null)}
                  onSubmit={(input) => handleEdit(goal.id, input)}
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-forest">
                        {goal.title}
                      </h3>
                      {goal.description ? (
                        <p className="mt-1 text-sm leading-relaxed text-ink/75">
                          {goal.description}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${chip.classes}`}
                    >
                      {chip.label}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-semibold text-forest">
                      {formatMinorAmount(goal.raised_amount, goal.currency)} of{" "}
                      {formatMinorAmount(goal.target_amount, goal.currency)}{" "}
                      <span className="font-normal text-ink/60">raised</span>
                    </p>
                    <ProgressBar
                      value={goalProgressPercent(
                        goal.raised_amount,
                        goal.target_amount,
                      )}
                      label={`Progress towards ${goal.title}`}
                      className="mt-2"
                    />
                  </div>

                  {goal.taken_down_at ? (
                    <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-900">
                      This goal was removed by BuyMeATee and can&apos;t be
                      published. If you think this is a mistake, contact
                      support.
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {!goal.taken_down_at ? transitionsFor[goal.status].map((transition) => (
                      <button
                        key={transition.to + transition.label}
                        type="button"
                        disabled={busy}
                        onClick={() => handleTransition(goal.id, transition.to)}
                        className={
                          transition.emphasis
                            ? "inline-flex min-h-9 items-center justify-center rounded-full bg-forest px-4 text-xs font-medium text-white transition-colors hover:bg-forest-dark disabled:opacity-60"
                            : secondaryButton
                        }
                      >
                        {transition.label}
                      </button>
                    )) : null}
                    {goal.status !== "archived" && !goal.taken_down_at ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(goal.id);
                            setCreating(false);
                          }}
                          className={secondaryButton}
                        >
                          Edit
                        </button>
                        {goal.status !== "completed" ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleTransition(goal.id, "archived")}
                            className={secondaryButton}
                          >
                            Archive
                          </button>
                        ) : null}
                      </>
                    ) : null}
                    {goal.raised_amount === 0 && goal.status === "draft" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(goal.id)}
                        className="inline-flex min-h-9 items-center justify-center rounded-full px-3.5 text-xs font-medium text-red-800/80 transition-colors hover:text-red-800 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    ) : null}
                    <span className="ml-auto flex gap-1">
                      <button
                        type="button"
                        disabled={busy || index === 0}
                        onClick={() => handleMove(goal.id, "up")}
                        aria-label={`Move ${goal.title} up`}
                        className={`${secondaryButton} px-2.5`}
                      >
                        <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={busy || index === goals.length - 1}
                        onClick={() => handleMove(goal.id, "down")}
                        aria-label={`Move ${goal.title} down`}
                        className={`${secondaryButton} px-2.5`}
                      >
                        <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
