import { NextResponse } from "next/server";

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

const failureResponses: Record<GoalMutationFailure, { error: string; status: number }> = {
  not_found: { error: "That goal no longer exists.", status: 404 },
  active_limit: {
    error: `You can have up to ${MAX_ACTIVE_GOALS} active goals. Complete or archive one first.`,
    status: 409,
  },
  invalid_transition: { error: "That change isn't possible from the goal's current state.", status: 409 },
  currency_locked: {
    error: "A goal that has received support keeps its currency.",
    status: 409,
  },
  has_support: {
    error: "This goal has received support, so it can't be deleted — archive it instead.",
    status: 409,
  },
  unavailable: { error: "Saving isn't available right now. Please try again.", status: 503 },
};

function failure(reason: GoalMutationFailure) {
  const { error, status } = failureResponses[reason];
  return NextResponse.json({ error }, { status });
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
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (isRateLimited(`goals:${user.id}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const { goalId } = await params;
  const payload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (payload?.action === "edit") {
    const validation = validateGoalInput(payload);
    if (!validation.ok) {
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }
    const result = await updateGoal(user.id, goalId, validation.data);
    return result.ok
      ? NextResponse.json({ goal: result.goal })
      : failure(result.reason);
  }

  if (payload?.action === "transition") {
    if (!isGoalStatus(payload.to)) {
      return NextResponse.json({ error: "Unknown goal status." }, { status: 400 });
    }
    const result = await transitionGoal(user.id, goalId, payload.to);
    return result.ok
      ? NextResponse.json({ goal: result.goal })
      : failure(result.reason);
  }

  if (payload?.action === "move") {
    if (payload.direction !== "up" && payload.direction !== "down") {
      return NextResponse.json({ error: "Unknown direction." }, { status: 400 });
    }
    const result = await moveGoal(user.id, goalId, payload.direction);
    return result.ok
      ? NextResponse.json({ moved: true })
      : failure("unavailable");
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
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
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { goalId } = await params;
  const result = await deleteGoal(user.id, goalId);
  return result.ok ? NextResponse.json({ deleted: true }) : failure(result.reason);
}
