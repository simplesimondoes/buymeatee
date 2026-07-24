import "server-only";

import { logPaymentEvent } from "@/lib/payments/log";
import type { GiftRow } from "@/lib/payments/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Notification queue boundary (ADR-009).
 *
 * Creator-directed notifications are enqueued in `gift_notifications` and
 * surfaced in the recipient dashboard. The email delivery worker
 * (`deliverPendingNotifications`, ADR-013) drains rows with status "pending" —
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

/**
 * Enqueue a "goal reached its target" notification for the Creator — but only
 * when THIS gift is the one that crossed the target. Goals never auto-complete
 * (ADR-011); this fires once at the crossing. Idempotent via (gift_id, type):
 * because the crediting contribution runs exactly once per gift, so does this.
 * The goal's Creator (creator_id) is a profile row, so it belongs in the
 * creator-directed gift_notifications queue.
 */
export async function enqueueGoalReachedNotification(
  gift: Pick<GiftRow, "id" | "goal_id" | "gift_amount">,
): Promise<void> {
  if (!gift.goal_id) {
    return;
  }
  const supabase = getSupabaseAdminClient();

  const { data: goal, error: loadError } = await supabase
    .from("creator_goals")
    .select("creator_id, title, target_amount, raised_amount, currency")
    .eq("id", gift.goal_id)
    .maybeSingle();

  if (loadError || !goal) {
    if (loadError) {
      logPaymentEvent("error", "notifications.goal_load_failed", {
        gift_id: gift.id,
        goal_id: gift.goal_id,
        reason: loadError.message,
      });
    }
    return;
  }

  const raisedAfter = goal.raised_amount as number;
  const raisedBefore = raisedAfter - gift.gift_amount;
  const target = goal.target_amount as number;
  const justCrossed = raisedBefore < target && raisedAfter >= target;
  if (!justCrossed) {
    return;
  }

  const { error } = await supabase.from("gift_notifications").upsert(
    {
      gift_id: gift.id,
      recipient_user_id: goal.creator_id,
      type: "goal_reached",
      payload: {
        goalTitle: goal.title,
        raisedAmount: raisedAfter,
        targetAmount: target,
        currency: goal.currency,
      },
    },
    { onConflict: "gift_id,type", ignoreDuplicates: true },
  );
  if (error) {
    logPaymentEvent("error", "notifications.goal_enqueue_failed", {
      gift_id: gift.id,
      goal_id: gift.goal_id,
      reason: error.message,
    });
  }
}
