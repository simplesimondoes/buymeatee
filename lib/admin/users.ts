import "server-only";

import type { CreatorGoalRow } from "@/lib/goals/types";
import type { SupportedCurrency } from "@/lib/payments/currency";
import { logPaymentEvent } from "@/lib/payments/log";
import {
  PAID_FAMILY_STATUSES,
  type ConnectedAccountRow,
} from "@/lib/payments/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Admin user management (issue #27). Callers must have verified admin
 * membership (lib/payments/admin.ts isAdmin) BEFORE calling anything here —
 * these functions run on the service role. Every state change is written to
 * the append-only admin_actions audit log in the same code path.
 */

export interface AdminProfileRow {
  id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  role: "creator" | "supporter";
  deactivated_at: string | null;
  created_at: string;
}

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, bio, country, role, deactivated_at, created_at";

export async function searchProfiles(
  query: string | undefined,
  limit = 50,
): Promise<AdminProfileRow[]> {
  const supabase = getSupabaseAdminClient();
  let builder = supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 200));

  const trimmed = query?.trim();
  if (trimmed) {
    if (/^[0-9a-f-]{36}$/i.test(trimmed)) {
      builder = builder.eq("id", trimmed.toLowerCase());
    } else {
      const escaped = trimmed.replace(/[%_]/g, "\\$&");
      builder = builder.or(
        `username.ilike.%${escaped}%,display_name.ilike.%${escaped}%`,
      );
    }
  }

  const { data, error } = await builder;
  if (error) {
    throw new Error(`Profile search failed: ${error.message}`);
  }
  return (data as AdminProfileRow[]) ?? [];
}

export interface AdminUserDetail {
  profile: AdminProfileRow;
  goals: CreatorGoalRow[];
  account: ConnectedAccountRow | null;
  giftTotals: Array<{ currency: SupportedCurrency; count: number; amount: number }>;
  recentActions: Array<{
    id: number;
    action: string;
    reason: string;
    created_at: string;
    admin_user_id: string;
  }>;
}

export async function getUserAdminDetail(
  userId: string,
): Promise<AdminUserDetail | null> {
  const supabase = getSupabaseAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (profileError) {
    throw new Error(`Profile lookup failed: ${profileError.message}`);
  }
  if (!profile) {
    return null;
  }

  const [goalsResult, accountResult, giftsResult, actionsResult] =
    await Promise.all([
      supabase
        .from("creator_goals")
        .select(
          "id, creator_id, title, description, currency, target_amount, raised_amount, status, sort_order, taken_down_at, created_at, updated_at",
        )
        .eq("creator_id", userId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("stripe_connected_accounts")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("gifts")
        .select("currency, gift_amount, status")
        .eq("recipient_user_id", userId),
      supabase
        .from("admin_actions")
        .select("id, action, reason, created_at, admin_user_id")
        .eq("target_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const totals = new Map<SupportedCurrency, { count: number; amount: number }>();
  for (const gift of (giftsResult.data ?? []) as Array<{
    currency: SupportedCurrency;
    gift_amount: number;
    status: string;
  }>) {
    if (!PAID_FAMILY_STATUSES.includes(gift.status as never)) {
      continue;
    }
    const entry = totals.get(gift.currency) ?? { count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += gift.gift_amount;
    totals.set(gift.currency, entry);
  }

  return {
    profile: profile as AdminProfileRow,
    goals: (goalsResult.data as CreatorGoalRow[]) ?? [],
    account: (accountResult.data as ConnectedAccountRow | null) ?? null,
    giftTotals: [...totals.entries()].map(([currency, entry]) => ({
      currency,
      ...entry,
    })),
    recentActions: (actionsResult.data as AdminUserDetail["recentActions"]) ?? [],
  };
}

export async function recordAdminAction(entry: {
  adminUserId: string;
  action: string;
  targetUserId?: string;
  targetGoalId?: string;
  reason: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("admin_actions").insert({
    admin_user_id: entry.adminUserId,
    action: entry.action,
    target_user_id: entry.targetUserId ?? null,
    target_goal_id: entry.targetGoalId ?? null,
    reason: entry.reason,
    detail: entry.detail ?? {},
  });
  if (error) {
    // The action itself succeeded — losing the audit row is an incident,
    // not something to hide behind a failed response.
    logPaymentEvent("error", "admin.audit_write_failed", {
      action: entry.action,
      target_user_id: entry.targetUserId,
      reason: error.message,
    });
  }
}

export type AdminUserMutationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "no_change" | "unavailable" };

export async function deactivateUser(
  adminUserId: string,
  targetUserId: string,
  reason: string,
): Promise<AdminUserMutationResult> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ deactivated_at: new Date().toISOString() })
    .eq("id", targetUserId)
    .is("deactivated_at", null)
    .select("id")
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
  await recordAdminAction({
    adminUserId,
    action: "profile_deactivated",
    targetUserId,
    reason,
  });
  logPaymentEvent("info", "admin.profile_deactivated", {
    admin_user_id: adminUserId,
    target_user_id: targetUserId,
  });
  return { ok: true };
}

export async function reinstateUser(
  adminUserId: string,
  targetUserId: string,
  reason: string,
): Promise<AdminUserMutationResult> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ deactivated_at: null })
    .eq("id", targetUserId)
    .not("deactivated_at", "is", null)
    .select("id")
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
  await recordAdminAction({
    adminUserId,
    action: "profile_reinstated",
    targetUserId,
    reason,
  });
  logPaymentEvent("info", "admin.profile_reinstated", {
    admin_user_id: adminUserId,
    target_user_id: targetUserId,
  });
  return { ok: true };
}
