import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { validateGoalInput } from "@/lib/goals/goal-schema";
import {
  deleteGoal,
  moveGoal,
  transitionGoal,
  updateGoal,
  type GoalMutationFailure,
} from "@/lib/goals/goals";
import { isGoalStatus, MAX_ACTIVE_GOALS } from "@/lib/goals/types";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Mutations on one of the signed-in creator's goals:
 *   POST { action: "edit", ...goal fields }
 *   POST { action: "transition", to: <status> }
 *   POST { action: "move", direction: "up" | "down" }
 *   DELETE — drafts and unsupported goals only; funded goals are archived.
 * Ownership is enforced by RLS plus the creator_id filter in lib/goals.
 */

const failureResponses: Record<
  Exclude<GoalMutationFailure, "active_limit">,
  { code: string; status: number }
> = {
  not_found: { code: "api.goalGone", status: 404 },
  invalid_transition: { code: "api.goalStateChange", status: 409 },
  currency_locked: { code: "api.goalCurrencyLocked", status: 409 },
  currency_mismatch: { code: "api.goalPayoutCurrency", status: 409 },
  has_support: { code: "api.goalHasSupport", status: 409 },
  unavailable: { code: "api.savingUnavailable", status: 503 },
};

function failure(reason: GoalMutationFailure) {
  if (reason === "active_limit") {
    // No stable code exists for the active-goal limit yet; the client hook
    // passes raw strings through, so this stays honest until one is added.
    return NextResponse.json(
      { error: { code: "api.goalActiveLimit", params: { max: MAX_ACTIVE_GOALS } } },
      { status: 409 },
    );
  }
  const { code, status } = failureResponses[reason];
  return apiError(code, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return failure("unavailable");
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  if (isRateLimited(`goals:${user.id}`, 30, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const { goalId } = await params;
  const payload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (payload?.action === "edit") {
    const validation = validateGoalInput(payload);
    if (!validation.ok) {
      return apiError("api.checkFields", {
        status: 400,
        fields: validation.errors,
      });
    }
    const result = await updateGoal(user.id, goalId, validation.data);
    return result.ok
      ? NextResponse.json({ goal: result.goal })
      : failure(result.reason);
  }

  if (payload?.action === "transition") {
    if (!isGoalStatus(payload.to)) {
      return apiError("api.goalStatusUnknown", { status: 400 });
    }
    const result = await transitionGoal(user.id, goalId, payload.to);
    return result.ok
      ? NextResponse.json({ goal: result.goal })
      : failure(result.reason);
  }

  if (payload?.action === "move") {
    if (payload.direction !== "up" && payload.direction !== "down") {
      return apiError("api.unknownDirection", { status: 400 });
    }
    const result = await moveGoal(user.id, goalId, payload.direction);
    return result.ok
      ? NextResponse.json({ moved: true })
      : failure("unavailable");
  }

  return apiError("api.unknownAction", { status: 400 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return failure("unavailable");
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }

  const { goalId } = await params;
  const result = await deleteGoal(user.id, goalId);
  return result.ok ? NextResponse.json({ deleted: true }) : failure(result.reason);
}
