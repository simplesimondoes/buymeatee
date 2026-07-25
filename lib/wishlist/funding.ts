import "server-only";

import { recordGiftEvent } from "@/lib/payments/gifts";
import { logPaymentEvent } from "@/lib/payments/log";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * The ONLY code path that marks a wish-list item funded or reverts it (ADR-018).
 * Called exclusively from verified webhook processing — gated on the exactly-
 * once paid / refund / dispute gift transitions, so replays never double-apply.
 * The funded_by_gift_id / funded_at columns and the 'funded' status are revoked
 * from every client role, so this trusted path is the only writer.
 */

/**
 * Flip a wish from 'active' to 'funded', recording the gift that paid for it.
 * Guarded on status='active' so two simultaneous funders can't both win — the
 * loser's gift is still a valid, recorded payment (surfaced by reconciliation
 * and the creator's support feed), just not the one credited to the item.
 * Returns true when THIS gift claimed the item.
 */
export async function markWishlistItemFunded(
  itemId: string,
  context: { giftId: string; stripeEventId: string },
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .update({
      status: "funded",
      funded_by_gift_id: context.giftId,
      funded_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("status", "active")
    .select("id")
    .maybeSingle();

  if (error) {
    // Never fail the payment flow over wish bookkeeping: log loudly.
    logPaymentEvent("error", "wishlist.fund_failed", {
      item_id: itemId,
      gift_id: context.giftId,
      reason: error.message,
    });
    await recordGiftEvent(
      context.giftId,
      "wishlist_fund_failed",
      { wishlist_item_id: itemId, reason: error.message },
      undefined,
      context.stripeEventId,
    );
    return false;
  }

  if (!data) {
    // The item wasn't 'active' (already funded, archived, or lost a race).
    logPaymentEvent("warn", "wishlist.fund_no_claim", {
      item_id: itemId,
      gift_id: context.giftId,
    });
    await recordGiftEvent(
      context.giftId,
      "wishlist_fund_no_claim",
      { wishlist_item_id: itemId },
      undefined,
      context.stripeEventId,
    );
    return false;
  }

  await recordGiftEvent(
    context.giftId,
    "wishlist_item_funded",
    { wishlist_item_id: itemId },
    undefined,
    context.stripeEventId,
  );
  logPaymentEvent("info", "wishlist.item_funded", {
    item_id: itemId,
    gift_id: context.giftId,
  });
  return true;
}

/**
 * Reverse funding when the paying gift is fully refunded or a dispute is lost:
 * the item returns to 'active' so it can be funded again. Only reverts the item
 * THIS gift funded (guarded on funded_by_gift_id), so an unrelated later gift's
 * funding is never disturbed. A funded item a creator has since archived stays
 * archived — we clear the attribution but don't resurrect it.
 */
export async function revertWishlistItemFunding(
  itemId: string,
  context: { giftId: string; stripeEventId: string; reason: string },
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  // Only the currently-funded status is reopened; archived stays archived.
  const { error } = await supabase
    .from("wishlist_items")
    .update({
      status: "active",
      funded_by_gift_id: null,
      funded_at: null,
    })
    .eq("id", itemId)
    .eq("status", "funded")
    .eq("funded_by_gift_id", context.giftId);
  if (error) {
    logPaymentEvent("error", "wishlist.revert_failed", {
      item_id: itemId,
      gift_id: context.giftId,
      reason: error.message,
    });
    return;
  }

  // Detach the attribution even if the item was archived after funding, so the
  // gift's identity as "the funder" is cleanly withdrawn.
  await supabase
    .from("wishlist_items")
    .update({ funded_by_gift_id: null, funded_at: null })
    .eq("id", itemId)
    .eq("funded_by_gift_id", context.giftId);

  await recordGiftEvent(
    context.giftId,
    "wishlist_funding_reverted",
    { wishlist_item_id: itemId, reason: context.reason },
    undefined,
    context.stripeEventId,
  );
  logPaymentEvent("info", "wishlist.funding_reverted", {
    item_id: itemId,
    gift_id: context.giftId,
    reason: context.reason,
  });
}
