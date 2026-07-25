import "server-only";

import { getFeeConfig } from "@/lib/payments/config";
import { getConnectedAccountForUser } from "@/lib/payments/connect";
import { calculateFees } from "@/lib/payments/fees";
import { markProfileAsCreator } from "@/lib/profile/role";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { WishlistItemInput } from "@/lib/wishlist/item-schema";
import {
  canTransitionWishlistItem,
  type WishlistItemRow,
  type WishlistItemStatus,
} from "@/lib/wishlist/types";

/**
 * Wish-list item reads and mutations for the item's owner. Everything runs on
 * the session client — RLS confines each operation to the caller's own items,
 * and the funded_by_gift_id / funded_at columns have no client write grant at
 * all. The DB triggers (funded-currency/price freeze) back up every rule here.
 */

const ITEM_COLUMNS =
  "id, creator_id, title, description, image_url, currency, price_amount, status, funded_by_gift_id, funded_at, sort_order, created_at, updated_at";

export type WishlistMutationResult =
  | { ok: true; item: WishlistItemRow }
  | { ok: false; reason: WishlistMutationFailure };

export type WishlistMutationFailure =
  | "not_found"
  | "invalid_transition"
  | "currency_locked"
  | "currency_mismatch"
  | "price_unfundable"
  | "has_support"
  | "unavailable";

/**
 * A wish must use the creator's payout currency, or supporters can't fund it
 * (gifts settle in the connected account's currency). No account yet → nothing
 * to match against (they can't receive gifts anyway).
 */
async function payoutCurrencyMismatch(
  userId: string,
  currency: string,
): Promise<boolean> {
  try {
    const account = await getConnectedAccountForUser(userId);
    return (
      Boolean(account?.default_currency) &&
      account?.default_currency !== currency
    );
  } catch {
    return false;
  }
}

/**
 * A wish is funded by ONE charge, so its price must fall within the single-gift
 * bounds — otherwise checkout would reject it and the item could never be
 * funded. Reuses the exact fee module the composer and checkout use.
 */
function priceIsUnfundable(input: WishlistItemInput): boolean {
  const fees = calculateFees(input.priceAmount, input.currency, getFeeConfig());
  return !fees.ok;
}

export async function getOwnItems(
  userId: string,
): Promise<WishlistItemRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select(ITEM_COLUMNS)
    .eq("creator_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`Failed to load wish-list items: ${error.message}`);
  }
  return (data as WishlistItemRow[]) ?? [];
}

async function getOwnItem(
  userId: string,
  itemId: string,
): Promise<WishlistItemRow | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("wishlist_items")
    .select(ITEM_COLUMNS)
    .eq("creator_id", userId)
    .eq("id", itemId)
    .maybeSingle();
  return (data as WishlistItemRow | null) ?? null;
}

export async function createItem(
  userId: string,
  input: WishlistItemInput,
): Promise<WishlistMutationResult> {
  try {
    if (await payoutCurrencyMismatch(userId, input.currency)) {
      return { ok: false, reason: "currency_mismatch" };
    }
    if (priceIsUnfundable(input)) {
      return { ok: false, reason: "price_unfundable" };
    }
    const supabase = await getSupabaseServerClient();
    const { data: last } = await supabase
      .from("wishlist_items")
      .select("sort_order")
      .eq("creator_id", userId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder =
      ((last as { sort_order: number } | null)?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("wishlist_items")
      .insert({
        creator_id: userId,
        title: input.title,
        description: input.description ?? null,
        currency: input.currency,
        price_amount: input.priceAmount,
        status: "draft",
        sort_order: sortOrder,
      })
      .select(ITEM_COLUMNS)
      .single();
    if (error || !data) {
      return { ok: false, reason: "unavailable" };
    }
    await markProfileAsCreator(userId);
    return { ok: true, item: data as WishlistItemRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function updateItem(
  userId: string,
  itemId: string,
  input: WishlistItemInput,
): Promise<WishlistMutationResult> {
  try {
    const existing = await getOwnItem(userId, itemId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    // A funded item's price/currency are frozen (the supporter paid exactly
    // that). The DB trigger backs this up.
    if (existing.funded_by_gift_id !== null) {
      if (input.currency !== existing.currency) {
        return { ok: false, reason: "currency_locked" };
      }
      if (input.priceAmount !== existing.price_amount) {
        return { ok: false, reason: "currency_locked" };
      }
    }
    if (await payoutCurrencyMismatch(userId, input.currency)) {
      return { ok: false, reason: "currency_mismatch" };
    }
    if (priceIsUnfundable(input)) {
      return { ok: false, reason: "price_unfundable" };
    }

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("wishlist_items")
      .update({
        title: input.title,
        description: input.description ?? null,
        currency: input.currency,
        price_amount: input.priceAmount,
      })
      .eq("creator_id", userId)
      .eq("id", itemId)
      .select(ITEM_COLUMNS)
      .maybeSingle();
    if (error || !data) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: true, item: data as WishlistItemRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function transitionItem(
  userId: string,
  itemId: string,
  to: WishlistItemStatus,
): Promise<WishlistMutationResult> {
  try {
    const existing = await getOwnItem(userId, itemId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    // 'funded' is never a creator-driven target (see canTransitionWishlistItem);
    // it's set only by the verified webhook path.
    if (!canTransitionWishlistItem(existing.status, to)) {
      return { ok: false, reason: "invalid_transition" };
    }

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("wishlist_items")
      .update({ status: to })
      .eq("creator_id", userId)
      .eq("id", itemId)
      // Re-checked in the filter so a concurrent transition loses cleanly.
      .eq("status", existing.status)
      .select(ITEM_COLUMNS)
      .maybeSingle();
    if (error || !data) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: true, item: data as WishlistItemRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export type DeleteWishlistItemResult =
  | { ok: true }
  | { ok: false; reason: WishlistMutationFailure };

export async function deleteItem(
  userId: string,
  itemId: string,
): Promise<DeleteWishlistItemResult> {
  try {
    const existing = await getOwnItem(userId, itemId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    // Items that have received support keep their history — archive instead.
    // The gifts.wishlist_item_id FK (on delete restrict) backs this up.
    if (existing.funded_by_gift_id !== null) {
      return { ok: false, reason: "has_support" };
    }

    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("creator_id", userId)
      .eq("id", itemId);
    if (error) {
      // FK restriction: a gift references this item (e.g. draft checkout).
      return {
        ok: false,
        reason: error.code === "23503" ? "has_support" : "unavailable",
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function moveItem(
  userId: string,
  itemId: string,
  direction: "up" | "down",
): Promise<{ ok: boolean }> {
  try {
    const items = await getOwnItems(userId);
    const index = items.findIndex((item) => item.id === itemId);
    if (index === -1) {
      return { ok: false };
    }
    const neighbourIndex = direction === "up" ? index - 1 : index + 1;
    const neighbour = items[neighbourIndex];
    if (!neighbour) {
      return { ok: true }; // Already at the edge — nothing to do.
    }

    const supabase = await getSupabaseServerClient();
    // Normalise both rows' sort_order and swap. Two updates; a torn state only
    // reorders cosmetically and self-heals on the next move.
    const { error: first } = await supabase
      .from("wishlist_items")
      .update({ sort_order: neighbourIndex })
      .eq("creator_id", userId)
      .eq("id", items[index].id);
    const { error: second } = await supabase
      .from("wishlist_items")
      .update({ sort_order: index })
      .eq("creator_id", userId)
      .eq("id", neighbour.id);
    return { ok: !first && !second };
  } catch {
    return { ok: false };
  }
}
