import "server-only";

import { recordAdminAction, type AdminUserMutationResult } from "@/lib/admin/users";
import type { CreatorGoalRow } from "@/lib/goals/types";
import { logPaymentEvent } from "@/lib/payments/log";
import { avatarObjectPath } from "@/lib/profile/avatar";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Content moderation (issue #28). Item-level takedowns of creator-entered
 * content: goals (reversible — taken_down_at) and profile fields (bio and
 * avatar are cleared; the removed content is preserved in the audit-log
 * detail so nothing is lost silently). Page-level takedown lives in
 * lib/admin/users.ts. Callers must have verified admin membership first.
 */

export interface ModerationGoalRow extends CreatorGoalRow {
  creator_username: string | null;
  creator_display_name: string;
}

export interface RecentContent {
  goals: ModerationGoalRow[];
  profiles: Array<{
    id: string;
    username: string | null;
    display_name: string;
    bio: string | null;
    avatar_url: string | null;
    updated_at: string;
  }>;
}

/** Recently touched public content, newest first — the review queue. */
export async function listRecentContent(limit = 30): Promise<RecentContent> {
  const supabase = getSupabaseAdminClient();
  const [goalsResult, profilesResult] = await Promise.all([
    supabase
      .from("creator_goals")
      .select(
        "id, creator_id, title, description, currency, target_amount, raised_amount, status, sort_order, taken_down_at, created_at, updated_at, profiles!creator_goals_creator_id_fkey(username, display_name)",
      )
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("profiles")
      .select("id, username, display_name, bio, avatar_url, updated_at")
      .or("bio.not.is.null,avatar_url.not.is.null")
      .order("updated_at", { ascending: false })
      .limit(limit),
  ]);
  if (goalsResult.error) {
    throw new Error(`Moderation goals query failed: ${goalsResult.error.message}`);
  }
  if (profilesResult.error) {
    throw new Error(
      `Moderation profiles query failed: ${profilesResult.error.message}`,
    );
  }

  const goals = ((goalsResult.data ?? []) as Array<Record<string, unknown>>).map(
    (row) => {
      const creator = row.profiles as {
        username: string | null;
        display_name: string;
      } | null;
      return {
        ...(row as unknown as CreatorGoalRow),
        creator_username: creator?.username ?? null,
        creator_display_name: creator?.display_name ?? "",
      };
    },
  );

  return {
    goals,
    profiles: (profilesResult.data as RecentContent["profiles"]) ?? [],
  };
}

export async function takeDownGoal(
  adminUserId: string,
  goalId: string,
  reason: string,
): Promise<AdminUserMutationResult> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("creator_goals")
    .update({ taken_down_at: new Date().toISOString(), status: "archived" })
    .eq("id", goalId)
    .is("taken_down_at", null)
    .select("id, creator_id, title")
    .maybeSingle();
  if (error) {
    return { ok: false, reason: "unavailable" };
  }
  if (!data) {
    const { data: exists } = await supabase
      .from("creator_goals")
      .select("id")
      .eq("id", goalId)
      .maybeSingle();
    return { ok: false, reason: exists ? "no_change" : "not_found" };
  }
  await recordAdminAction({
    adminUserId,
    action: "goal_taken_down",
    targetUserId: data.creator_id as string,
    targetGoalId: goalId,
    reason,
    detail: { title: data.title },
  });
  logPaymentEvent("info", "admin.goal_taken_down", {
    admin_user_id: adminUserId,
    goal_id: goalId,
  });
  return { ok: true };
}

export async function restoreGoal(
  adminUserId: string,
  goalId: string,
  reason: string,
): Promise<AdminUserMutationResult> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("creator_goals")
    .update({ taken_down_at: null })
    .eq("id", goalId)
    .not("taken_down_at", "is", null)
    .select("id, creator_id")
    .maybeSingle();
  if (error) {
    return { ok: false, reason: "unavailable" };
  }
  if (!data) {
    const { data: exists } = await supabase
      .from("creator_goals")
      .select("id")
      .eq("id", goalId)
      .maybeSingle();
    return { ok: false, reason: exists ? "no_change" : "not_found" };
  }
  await recordAdminAction({
    adminUserId,
    action: "goal_restored",
    targetUserId: data.creator_id as string,
    targetGoalId: goalId,
    reason,
  });
  return { ok: true };
}

/** Clears a bio; the removed text is preserved in the audit detail. */
export async function clearProfileBio(
  adminUserId: string,
  targetUserId: string,
  reason: string,
): Promise<AdminUserMutationResult> {
  const supabase = getSupabaseAdminClient();
  // Read the text first — it goes into the audit detail so a takedown never
  // destroys content irrecoverably.
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id, bio")
    .eq("id", targetUserId)
    .maybeSingle();
  if (readError) {
    return { ok: false, reason: "unavailable" };
  }
  if (!existing) {
    return { ok: false, reason: "not_found" };
  }
  if (existing.bio === null) {
    return { ok: false, reason: "no_change" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ bio: null })
    .eq("id", targetUserId)
    .eq("bio", existing.bio)
    .select("id")
    .maybeSingle();
  if (error) {
    return { ok: false, reason: "unavailable" };
  }
  if (!data) {
    return { ok: false, reason: "no_change" };
  }
  await recordAdminAction({
    adminUserId,
    action: "profile_bio_cleared",
    targetUserId,
    reason,
    detail: { removed_bio: existing.bio },
  });
  return { ok: true };
}

/** Removes an avatar: clears the URL and deletes the storage object. */
export async function removeProfileAvatar(
  adminUserId: string,
  targetUserId: string,
  reason: string,
): Promise<AdminUserMutationResult> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", targetUserId)
    .not("avatar_url", "is", null)
    .select("id, avatar_url")
    .maybeSingle();
  if (error) {
    return { ok: false, reason: "unavailable" };
  }
  if (!data) {
    const { data: exists } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", targetUserId)
      .maybeSingle();
    return { ok: false, reason: exists ? "no_change" : "not_found" };
  }

  const { error: storageError } = await supabase.storage
    .from("avatars")
    .remove([avatarObjectPath(targetUserId)]);
  if (storageError) {
    // URL is already cleared, so nothing renders it — but the object
    // lingering in the public bucket is worth an operational alert.
    logPaymentEvent("error", "admin.avatar_object_remove_failed", {
      target_user_id: targetUserId,
      reason: storageError.message,
    });
  }

  await recordAdminAction({
    adminUserId,
    action: "profile_avatar_removed",
    targetUserId,
    reason,
  });
  return { ok: true };
}
