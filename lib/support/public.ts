import "server-only";

import type { SupportedCurrency } from "@/lib/payments/currency";
import { isLivemode } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Public "recent support" projection for a creator's page. Runs on the admin
 * client (gifts are not anon-readable) but returns ONLY safe fields — the
 * anonymity flag is applied here and an email or Stripe id never leaves this
 * module. Derives the recent feed, the total count and per-goal counts from a
 * single query of the creator's paid gifts.
 */

/** What a Tee was put toward — null means general support. */
export type SupportTargetLabel = {
  kind: "goal" | "wishlist";
  title: string;
} | null;

export interface RecentSupportItem {
  /** Anonymity already applied — safe to render. */
  displayName: string;
  message: string | null;
  amount: number;
  currency: SupportedCurrency;
  paidAt: string | null;
  target: SupportTargetLabel;
}

export interface CreatorSupport {
  recent: RecentSupportItem[];
  totalCount: number;
  /** goal_id → number of paid gifts toward it. */
  byGoal: Record<string, number>;
}

const RECENT_SHOWN = 8;

type PaidGiftRow = {
  is_anonymous: boolean;
  sender_name: string | null;
  message: string | null;
  gift_amount: number;
  currency: SupportedCurrency;
  paid_at: string | null;
  goal_id: string | null;
  wishlist_item_id: string | null;
};

export async function getCreatorSupport(
  creatorId: string,
): Promise<CreatorSupport> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("gifts")
    .select(
      "is_anonymous, sender_name, message, gift_amount, currency, paid_at, goal_id, wishlist_item_id",
    )
    .eq("recipient_user_id", creatorId)
    .eq("status", "paid")
    // Only gifts from the current environment: test-mode Tees never show up as
    // real support once live keys are configured, and vice versa.
    .eq("livemode", isLivemode())
    .order("paid_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to load support: ${error.message}`);
  }

  const rows = (data as PaidGiftRow[]) ?? [];
  const byGoal: Record<string, number> = {};
  for (const row of rows) {
    if (row.goal_id) {
      byGoal[row.goal_id] = (byGoal[row.goal_id] ?? 0) + 1;
    }
  }

  // Resolve titles once for the rows we'll actually show.
  const shown = rows.slice(0, RECENT_SHOWN);
  const titles = await loadTargetTitles(
    supabase,
    creatorId,
    shown.some((row) => row.goal_id),
    shown.some((row) => row.wishlist_item_id),
  );

  const recent: RecentSupportItem[] = shown.map((row) => ({
    displayName: row.is_anonymous
      ? "Anonymous"
      : row.sender_name?.trim() || "A supporter",
    message: row.message?.trim() ? row.message.trim() : null,
    amount: row.gift_amount,
    currency: row.currency,
    paidAt: row.paid_at,
    target: row.goal_id
      ? { kind: "goal", title: titles.goals[row.goal_id] ?? "a goal" }
      : row.wishlist_item_id
        ? {
            kind: "wishlist",
            title: titles.wishlist[row.wishlist_item_id] ?? "an item",
          }
        : null,
  }));

  return { recent, totalCount: rows.length, byGoal };
}

/** Build id → title maps for a creator's goals and wish-list items. */
async function loadTargetTitles(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  creatorId: string,
  needGoals: boolean,
  needWishlist: boolean,
): Promise<{ goals: Record<string, string>; wishlist: Record<string, string> }> {
  const goals: Record<string, string> = {};
  const wishlist: Record<string, string> = {};
  if (needGoals) {
    const { data } = await supabase
      .from("creator_goals")
      .select("id, title")
      .eq("creator_id", creatorId);
    for (const row of (data ?? []) as { id: string; title: string }[]) {
      goals[row.id] = row.title;
    }
  }
  if (needWishlist) {
    const { data } = await supabase
      .from("wishlist_items")
      .select("id, title")
      .eq("creator_id", creatorId);
    for (const row of (data ?? []) as { id: string; title: string }[]) {
      wishlist[row.id] = row.title;
    }
  }
  return { goals, wishlist };
}
