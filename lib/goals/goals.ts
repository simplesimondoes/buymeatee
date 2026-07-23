import "server-only";

import type { GoalInput } from "@/lib/goals/goal-schema";
import {
  canTransitionGoal,
  MAX_ACTIVE_GOALS,
  type CreatorGoalRow,
  type GoalStatus,
} from "@/lib/goals/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Goal reads and mutations for the goal's owner. Everything runs on the
 * session client — RLS confines each operation to the caller's own goals,
 * and the raised_amount column has no client write grant at all. The DB
 * triggers (active limit, funded-currency freeze) back up every rule here.
 */

const GOAL_COLUMNS =
  "id, creator_id, title, description, currency, target_amount, raised_amount, status, sort_order, taken_down_at, created_at, updated_at";

export type GoalMutationResult =
  | { ok: true; goal: CreatorGoalRow }
  | { ok: false; reason: GoalMutationFailure };

export type GoalMutationFailure =
  | "not_found"
  | "active_limit"
  | "invalid_transition"
  | "currency_locked"
  | "has_support"
  | "unavailable";

export async function getOwnGoals(userId: string): Promise<CreatorGoalRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("creator_goals")
    .select(GOAL_COLUMNS)
    .eq("creator_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`Failed to load goals: ${error.message}`);
  }
  return (data as CreatorGoalRow[]) ?? [];
}

async function getOwnGoal(
  userId: string,
  goalId: string,
): Promise<CreatorGoalRow | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("creator_goals")
    .select(GOAL_COLUMNS)
    .eq("creator_id", userId)
    .eq("id", goalId)
    .maybeSingle();
  return (data as CreatorGoalRow | null) ?? null;
}

async function countActiveGoals(userId: string): Promise<number> {
  const supabase = await getSupabaseServerClient();
  const { count, error } = await supabase
    .from("creator_goals")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", userId)
    .eq("status", "active");
  if (error) {
    throw new Error(`Failed to count active goals: ${error.message}`);
  }
  return count ?? 0;
}

export async function createGoal(
  userId: string,
  input: GoalInput,
): Promise<GoalMutationResult> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: last } = await supabase
      .from("creator_goals")
      .select("sort_order")
      .eq("creator_id", userId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = ((last as { sort_order: number } | null)?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("creator_goals")
      .insert({
        creator_id: userId,
        title: input.title,
        description: input.description ?? null,
        currency: input.currency,
        target_amount: input.targetAmount,
        status: "draft",
        sort_order: sortOrder,
      })
      .select(GOAL_COLUMNS)
      .single();
    if (error || !data) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: true, goal: data as CreatorGoalRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function updateGoal(
  userId: string,
  goalId: string,
  input: GoalInput,
): Promise<GoalMutationResult> {
  try {
    const existing = await getOwnGoal(userId, goalId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    if (existing.raised_amount > 0 && input.currency !== existing.currency) {
      return { ok: false, reason: "currency_locked" };
    }

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("creator_goals")
      .update({
        title: input.title,
        description: input.description ?? null,
        currency: input.currency,
        target_amount: input.targetAmount,
      })
      .eq("creator_id", userId)
      .eq("id", goalId)
      .select(GOAL_COLUMNS)
      .maybeSingle();
    if (error || !data) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: true, goal: data as CreatorGoalRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function transitionGoal(
  userId: string,
  goalId: string,
  to: GoalStatus,
): Promise<GoalMutationResult> {
  try {
    const existing = await getOwnGoal(userId, goalId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    if (!canTransitionGoal(existing.status, to)) {
      return { ok: false, reason: "invalid_transition" };
    }
    if (to === "active" && (await countActiveGoals(userId)) >= MAX_ACTIVE_GOALS) {
      return { ok: false, reason: "active_limit" };
    }

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("creator_goals")
      .update({ status: to })
      .eq("creator_id", userId)
      .eq("id", goalId)
      // Re-checked in the filter so a concurrent transition loses cleanly.
      .eq("status", existing.status)
      .select(GOAL_COLUMNS)
      .maybeSingle();
    if (error || !data) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: true, goal: data as CreatorGoalRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export type DeleteGoalResult =
  | { ok: true }
  | { ok: false; reason: GoalMutationFailure };

export async function deleteGoal(
  userId: string,
  goalId: string,
): Promise<DeleteGoalResult> {
  try {
    const existing = await getOwnGoal(userId, goalId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    // Goals that have received support keep their history — archive instead.
    // The gifts.goal_id FK (on delete restrict) backs this up in the DB.
    if (existing.raised_amount > 0) {
      return { ok: false, reason: "has_support" };
    }

    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("creator_goals")
      .delete()
      .eq("creator_id", userId)
      .eq("id", goalId);
    if (error) {
      // FK restriction: a gift references this goal (e.g. draft checkout).
      return { ok: false, reason: error.code === "23503" ? "has_support" : "unavailable" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function moveGoal(
  userId: string,
  goalId: string,
  direction: "up" | "down",
): Promise<{ ok: boolean }> {
  try {
    const goals = await getOwnGoals(userId);
    const index = goals.findIndex((goal) => goal.id === goalId);
    if (index === -1) {
      return { ok: false };
    }
    const neighbourIndex = direction === "up" ? index - 1 : index + 1;
    const neighbour = goals[neighbourIndex];
    if (!neighbour) {
      return { ok: true }; // Already at the edge — nothing to do.
    }

    const supabase = await getSupabaseServerClient();
    // Normalise both rows' sort_order and swap. Two updates; a torn state
    // only reorders cosmetically and self-heals on the next move.
    const { error: first } = await supabase
      .from("creator_goals")
      .update({ sort_order: neighbourIndex })
      .eq("creator_id", userId)
      .eq("id", goals[index].id);
    const { error: second } = await supabase
      .from("creator_goals")
      .update({ sort_order: index })
      .eq("creator_id", userId)
      .eq("id", neighbour.id);
    return { ok: !first && !second };
  } catch {
    return { ok: false };
  }
}
