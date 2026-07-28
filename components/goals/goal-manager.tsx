"use client";

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { GoalForm, type GoalFormErrors } from "@/components/goals/goal-form";
import { useErrorMessage } from "@/components/intl/use-error-message";
import { CoverUploader } from "@/components/profile/cover-uploader";
import { ProgressBar } from "@/components/progress-bar";
import { ShareControls } from "@/components/share-controls";
import {
  completedGoalShareText,
  goalShareText,
  reachedMilestone,
} from "@/lib/goals/share";
import type { GoalInput } from "@/lib/goals/goal-schema";
import {
  goalProgressPercent,
  isPubliclyVisible,
  MAX_ACTIVE_GOALS,
  type CreatorGoalRow,
  type GoalStatus,
} from "@/lib/goals/types";
import { errorDetail, type ErrorDetail } from "@/lib/i18n/errors";
import { formatMinorAmount } from "@/lib/i18n/format";
import type { AppLocale } from "@/i18n/locales";
import type { SupportedCurrency } from "@/lib/payments/currency";

/**
 * The creator's goal list: create, edit, reorder and move goals through
 * their lifecycle. The server owns every rule (limits, transitions,
 * currency freeze) — this component just reflects its answers.
 */

const statusChipClasses: Record<GoalStatus, string> = {
  draft: "bg-mist text-ink/70",
  active: "bg-forest/10 text-forest",
  completed: "bg-gold/20 text-gold-deep",
  archived: "bg-stone/60 text-ink/70",
};

type Transition = {
  to: GoalStatus;
  labelKey: "publish" | "markCompleted" | "takeOff" | "reopen" | "restore";
  emphasis?: boolean;
};

const transitionsFor: Record<GoalStatus, Transition[]> = {
  draft: [{ to: "active", labelKey: "publish", emphasis: true }],
  active: [
    { to: "completed", labelKey: "markCompleted", emphasis: true },
    { to: "draft", labelKey: "takeOff" },
  ],
  completed: [{ to: "active", labelKey: "reopen" }],
  archived: [{ to: "draft", labelKey: "restore" }],
};

const secondaryButton =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-stone px-3.5 text-xs font-medium text-ink/70 transition-colors hover:border-forest/40 hover:text-forest disabled:opacity-60";

async function postGoalAction(
  goalId: string,
  body: Record<string, unknown>,
): Promise<{
  goal?: CreatorGoalRow;
  errors?: GoalFormErrors;
  error?: ErrorDetail | string;
}> {
  try {
    const response = await fetch(`/api/goals/${goalId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json().catch(() => ({}))) as {
      goal?: CreatorGoalRow;
      errors?: GoalFormErrors;
      error?: ErrorDetail | string;
    };
  } catch {
    return { error: errorDetail("generic") };
  }
}

export function GoalManager({
  initialGoals,
  payoutCurrency,
  pageUrl,
}: {
  initialGoals: CreatorGoalRow[];
  payoutCurrency?: SupportedCurrency;
  /**
   * Absolute URL of the creator's public page, when they've claimed a
   * username. Undefined hides sharing — there's nothing public to link to yet.
   */
  pageUrl?: string;
}) {
  const t = useTranslations("dashboard");
  const locale = useLocale() as AppLocale;
  const errorMessage = useErrorMessage();
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
        error?: ErrorDetail | string;
      };
      if (response.ok && body.goal) {
        setGoals((current) => [...current, body.goal as CreatorGoalRow]);
        setCreating(false);
        return null;
      }
      return { errors: body.errors, error: body.error };
    } catch {
      return { error: errorDetail("generic") };
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
      setActionError(errorMessage(body.error ?? null));
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
      setActionError(errorMessage(body.error));
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
          error?: ErrorDetail | string;
        };
        setActionError(errorMessage(body.error ?? null));
      }
    } catch {
      setActionError(errorMessage(null));
    }
    setBusyId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink/70">
          {t("goals.manager.activeCount", {
            count: activeCount,
            max: MAX_ACTIVE_GOALS,
          })}
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
            {t("goals.manager.newGoal")}
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
            {t("goals.manager.newGoal")}
          </h2>
          <GoalForm
            payoutCurrency={payoutCurrency}
            submitLabel={t("goals.manager.saveGoal")}
            onCancel={() => setCreating(false)}
            onSubmit={handleCreate}
          />
        </div>
      ) : null}

      {goals.length === 0 && !creating ? (
        <div className="rounded-3xl border border-stone bg-mist p-6 text-center sm:p-10">
          <h2 className="font-serif text-xl font-semibold text-forest">
            {t("goals.manager.emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
            {t.rich("goals.manager.emptyBody", {
              example: (chunks) => <em>{chunks}</em>,
            })}
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            {t("goals.manager.addFirstGoal")}
          </button>
        </div>
      ) : null}

      <ul className="space-y-4">
        {goals.map((goal, index) => {
          const busy = busyId === goal.id;
          const canShare = Boolean(pageUrl) && isPubliclyVisible(goal.status);
          const milestone =
            goal.status === "active"
              ? reachedMilestone(goal.raised_amount, goal.target_amount)
              : null;
          return (
            <li
              key={goal.id}
              className="rounded-3xl border border-stone bg-white p-5 sm:p-6"
            >
              {editingId === goal.id ? (
                <div className="space-y-6">
                  <CoverUploader
                    endpoint={`/api/goals/${goal.id}/cover`}
                    initialUrl={goal.cover_image_url}
                    label={t("goals.manager.coverLabel")}
                    helpText={t("goals.manager.coverHelp")}
                    aspectClassName="aspect-[16/9]"
                  />
                  <GoalForm
                    initialTitle={goal.title}
                    initialDescription={goal.description ?? ""}
                    initialCurrency={goal.currency}
                    initialTargetAmount={goal.target_amount}
                    currencyLocked={goal.raised_amount > 0}
                    payoutCurrency={payoutCurrency}
                    submitLabel={t("actions.saveChanges")}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(input) => handleEdit(goal.id, input)}
                  />
                </div>
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
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusChipClasses[goal.status]}`}
                    >
                      {t(`goals.manager.status.${goal.status}`)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-semibold text-forest">
                      {t.rich("goals.manager.raised", {
                        raised: formatMinorAmount(
                          goal.raised_amount,
                          goal.currency,
                          locale,
                        ),
                        target: formatMinorAmount(
                          goal.target_amount,
                          goal.currency,
                          locale,
                        ),
                        muted: (chunks) => (
                          <span className="font-normal text-ink/70">
                            {chunks}
                          </span>
                        ),
                      })}
                    </p>
                    <ProgressBar
                      value={goalProgressPercent(
                        goal.raised_amount,
                        goal.target_amount,
                      )}
                      label={t("goals.manager.progressLabel", {
                        title: goal.title,
                      })}
                      className="mt-2"
                    />
                  </div>

                  {canShare && milestone ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gold/10 p-3">
                      <p className="text-sm text-gold-deep">
                        {milestone === 100
                          ? t("goals.manager.milestoneReached")
                          : t("goals.manager.milestoneProgress", {
                              percent: milestone,
                            })}
                      </p>
                      <ShareControls
                        url={pageUrl as string}
                        text={goalShareText(
                          goal.title,
                          goal.raised_amount,
                          goal.target_amount,
                        )}
                        buttonLabel={t("goals.manager.shareProgress")}
                        align="right"
                      />
                    </div>
                  ) : null}

                  {goal.taken_down_at ? (
                    <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-900">
                      {t("goals.manager.takenDown")}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {!goal.taken_down_at ? transitionsFor[goal.status].map((transition) => (
                      <button
                        key={transition.to + transition.labelKey}
                        type="button"
                        disabled={busy}
                        onClick={() => handleTransition(goal.id, transition.to)}
                        className={
                          transition.emphasis
                            ? "inline-flex min-h-9 items-center justify-center rounded-full bg-forest px-4 text-xs font-medium text-white transition-colors hover:bg-forest-dark disabled:opacity-60"
                            : secondaryButton
                        }
                      >
                        {t(`goals.manager.transitions.${transition.labelKey}`)}
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
                          {t("actions.edit")}
                        </button>
                        {goal.status !== "completed" ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleTransition(goal.id, "archived")}
                            className={secondaryButton}
                          >
                            {t("actions.archive")}
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
                        {t("actions.delete")}
                      </button>
                    ) : null}
                    {canShare && !milestone ? (
                      <ShareControls
                        url={pageUrl as string}
                        text={
                          goal.status === "completed"
                            ? completedGoalShareText(goal.title)
                            : goalShareText(
                                goal.title,
                                goal.raised_amount,
                                goal.target_amount,
                              )
                        }
                      />
                    ) : null}
                    <span className="ml-auto flex gap-1">
                      <button
                        type="button"
                        disabled={busy || index === 0}
                        onClick={() => handleMove(goal.id, "up")}
                        aria-label={t("goals.manager.moveUp", {
                          title: goal.title,
                        })}
                        className={`${secondaryButton} px-2.5`}
                      >
                        <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={busy || index === goals.length - 1}
                        onClick={() => handleMove(goal.id, "down")}
                        aria-label={t("goals.manager.moveDown", {
                          title: goal.title,
                        })}
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
