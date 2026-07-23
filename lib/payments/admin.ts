import "server-only";

import { recordGiftEvent } from "@/lib/payments/gifts";
import { logPaymentEvent } from "@/lib/payments/log";
import { PAID_FAMILY_STATUSES, type GiftRow } from "@/lib/payments/types";
import { getStripeClient } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Admin services. Every entry point re-checks admin membership server-side
 * against admin_users — admin access is never a frontend-only property.
 * Rows in admin_users are added manually (SQL/dashboard), never by the app.
 */

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    logPaymentEvent("error", "admin.membership_check_failed", {
      reason: error.message,
    });
    return false;
  }
  return Boolean(data);
}

export interface AdminGiftSearch {
  /** Matches gift public id, Checkout Session id, PaymentIntent id or recipient username. */
  query?: string;
  status?: string;
  limit?: number;
}

export async function searchGifts(search: AdminGiftSearch): Promise<GiftRow[]> {
  const supabase = getSupabaseAdminClient();
  let builder = supabase
    .from("gifts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(search.limit ?? 50, 200));

  if (search.status) {
    builder = builder.eq("status", search.status);
  }

  const query = search.query?.trim();
  if (query) {
    if (query.startsWith("cs_")) {
      builder = builder.eq("stripe_checkout_session_id", query);
    } else if (query.startsWith("pi_")) {
      builder = builder.eq("stripe_payment_intent_id", query);
    } else if (/^[0-9a-f-]{36}$/i.test(query)) {
      builder = builder.eq("public_id", query.toLowerCase());
    } else {
      // Recipient username lookup.
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", query.toLowerCase())
        .maybeSingle();
      if (!profile) {
        return [];
      }
      builder = builder.eq("recipient_user_id", profile.id);
    }
  }

  const { data, error } = await builder;
  if (error) {
    throw new Error(`Gift search failed: ${error.message}`);
  }
  return (data ?? []) as GiftRow[];
}

export async function listReconciliationErrors(): Promise<GiftRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .not("reconciliation_error", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    throw new Error(`Reconciliation list failed: ${error.message}`);
  }
  return (data ?? []) as GiftRow[];
}

export type RefundResult =
  | { ok: true; refundId: string }
  | { ok: false; error: "not-found" | "not-refundable" | "unavailable" };

/**
 * Full refund of a destination charge, admin-only (MVP; the data model
 * supports partial refunds). The transfer to the recipient is reversed and
 * the application fee refunded, so the platform never funds a recipient's
 * retained transfer after returning the donor's money. The authoritative
 * status update arrives via the charge.refunded webhook.
 */
export async function adminRefundGift(
  giftPublicId: string,
  adminUserId: string,
  reason: string,
): Promise<RefundResult> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .eq("public_id", giftPublicId)
    .maybeSingle();
  if (error || !data) {
    return { ok: false, error: "not-found" };
  }
  const gift = data as GiftRow;

  if (
    !gift.stripe_payment_intent_id ||
    !PAID_FAMILY_STATUSES.includes(gift.status) ||
    gift.status === "refunded" ||
    gift.amount_refunded >= gift.total_amount
  ) {
    return { ok: false, error: "not-refundable" };
  }

  try {
    const stripe = getStripeClient();
    const refund = await stripe.refunds.create(
      {
        payment_intent: gift.stripe_payment_intent_id,
        reverse_transfer: true,
        refund_application_fee: true,
      },
      { idempotencyKey: `bmat-refund-full-${gift.id}` },
    );

    const { error: upsertError } = await supabase.from("gift_refunds").upsert(
      {
        gift_id: gift.id,
        stripe_refund_id: refund.id,
        amount: refund.amount,
        currency: gift.currency,
        status: refund.status ?? "pending",
        reason: refund.reason ?? null,
        transfer_reversed: true,
        application_fee_refunded: true,
        requested_by: adminUserId,
        requested_reason: reason,
      },
      { onConflict: "stripe_refund_id" },
    );
    if (upsertError) {
      logPaymentEvent("error", "refund.record_failed", {
        gift_id: gift.id,
        stripe_refund_id: refund.id,
        reason: upsertError.message,
      });
    }

    await recordGiftEvent(gift.id, "refund_requested", {
      stripe_refund_id: refund.id,
      requested_by: adminUserId,
      requested_reason: reason,
    });
    logPaymentEvent("info", "refund.requested", {
      gift_id: gift.id,
      stripe_refund_id: refund.id,
      requested_by: adminUserId,
    });
    return { ok: true, refundId: refund.id };
  } catch (refundError) {
    logPaymentEvent("error", "refund.failed", {
      gift_id: gift.id,
      reason: refundError instanceof Error ? refundError.message : "unknown",
    });
    return { ok: false, error: "unavailable" };
  }
}
