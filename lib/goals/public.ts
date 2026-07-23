import "server-only";

import type { CreatorGoalRow } from "@/lib/goals/types";
import { getSupabaseAnonClient } from "@/lib/supabase/anon";

/**
 * Public reads of a creator's goals. Deliberately on the anonymous client:
 * the RLS policy ("published goals are viewable by everyone") is what keeps
 * drafts and archived goals invisible — not a filter someone could forget.
 * The status filters below only shape ordering within what RLS exposes.
 */

const PUBLIC_GOAL_COLUMNS =
  "id, creator_id, title, description, currency, target_amount, raised_amount, status, sort_order, taken_down_at, created_at, updated_at";

export interface PublicGoals {
  active: CreatorGoalRow[];
  /** Most recently completed goals — proof of a real journey. */
  completed: CreatorGoalRow[];
}

const COMPLETED_GOALS_SHOWN = 3;

export async function getPublicGoalsForCreator(
  creatorId: string,
): Promise<PublicGoals> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("creator_goals")
    .select(PUBLIC_GOAL_COLUMNS)
    .eq("creator_id", creatorId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`Failed to load public goals: ${error.message}`);
  }
  const goals = (data as CreatorGoalRow[]) ?? [];
  return {
    active: goals.filter((goal) => goal.status === "active"),
    completed: goals
      .filter((goal) => goal.status === "completed")
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, COMPLETED_GOALS_SHOWN),
  };
}
