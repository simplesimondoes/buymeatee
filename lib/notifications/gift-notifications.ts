import "server-only";

import { logPaymentEvent } from "@/lib/payments/log";
import type { GiftRow } from "@/lib/payments/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Notification queue boundary (ADR-009).
 *
 * The site has no email provider yet, so notifications are enqueued in
 * `gift_notifications` and surfaced in the recipient dashboard. When an email
 * provider is chosen, a delivery worker drains rows with status "pending" —
 * webhook processing never couples to delivery, and a delivery failure never
 * fails the payment.
 *
 * Idempotency: the (gift_id, type) unique constraint means webhook retries
 * can never enqueue a second notification for the same gift.
 */
export async function enqueueGiftReceivedNotification(
  gift: Pick<
    GiftRow,
    | "id"
    | "recipient_user_id"
    | "sender_name"
    | "is_anonymous"
    | "gift_amount"
    | "currency"
    | "message"
  >,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("gift_notifications").upsert(
    {
      gift_id: gift.id,
      recipient_user_id: gift.recipient_user_id,
      type: "gift_received",
      payload: {
        // The donor's anonymity choice is applied here, once, at write time.
        senderDisplayName: gift.is_anonymous ? "Anonymous" : gift.sender_name,
        giftAmount: gift.gift_amount,
        currency: gift.currency,
        message: gift.message,
      },
    },
    { onConflict: "gift_id,type", ignoreDuplicates: true },
  );
  if (error) {
    // Never fail the payment because of a notification problem.
    logPaymentEvent("error", "notifications.enqueue_failed", {
      gift_id: gift.id,
      reason: error.message,
    });
  }
}
