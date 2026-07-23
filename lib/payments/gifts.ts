import "server-only";

import { getFeeConfig, getStripeUrls } from "@/lib/payments/config";
import { formatMinorAmount } from "@/lib/payments/currency";
import { calculateFees, type FeeCalculationError } from "@/lib/payments/fees";
import type { GiftInput } from "@/lib/payments/gift-schema";
import { logPaymentEvent } from "@/lib/payments/log";
import {
  canReceiveGifts,
  type ConnectedAccountRow,
  type GiftRow,
  type GiftStatus,
} from "@/lib/payments/types";
import { getStripeClient, isLivemode } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Gift + Checkout Session service (ADR-009).
 *
 * Destination charges: the payment is created on the platform account with
 * transfer_data.destination set to the recipient's connected account and
 * application_fee_amount covering the platform fee + payment handling, so the
 * recipient's transfer equals the gift amount exactly. All amounts are
 * recalculated server-side; client totals are display estimates only.
 */

export async function recordGiftEvent(
  giftId: string,
  eventType: string,
  detail: Record<string, unknown> = {},
  statusChange?: { from: GiftStatus | null; to: GiftStatus | null },
  stripeEventId?: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("gift_events").insert({
    gift_id: giftId,
    event_type: eventType,
    from_status: statusChange?.from ?? null,
    to_status: statusChange?.to ?? null,
    stripe_event_id: stripeEventId ?? null,
    detail,
  });
  if (error) {
    // The audit trail must not break payment flows; log and continue.
    logPaymentEvent("error", "gifts.event_write_failed", {
      gift_id: giftId,
      event_type: eventType,
      reason: error.message,
    });
  }
}

export type CreateCheckoutError =
  | { kind: "recipient-not-found" }
  | { kind: "recipient-not-ready" }
  | { kind: "currency-mismatch" }
  | { kind: "goal-not-available" }
  | { kind: "amount"; error: FeeCalculationError }
  | { kind: "unavailable" };

export type CreateCheckoutResult =
  | { ok: true; checkoutUrl: string; giftPublicId: string }
  | { ok: false; error: CreateCheckoutError };

export async function createGiftCheckout(
  input: GiftInput,
  senderUserId: string | null,
): Promise<CreateCheckoutResult> {
  const supabase = getSupabaseAdminClient();

  // 1. Resolve the recipient from the username — never from a client-supplied
  //    Stripe account id.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name, deactivated_at")
    .eq("username", input.recipientUsername)
    .maybeSingle();
  if (profileError) {
    logPaymentEvent("error", "checkout.profile_lookup_failed", {
      reason: profileError.message,
    });
    return { ok: false, error: { kind: "unavailable" } };
  }
  if (!profile) {
    return { ok: false, error: { kind: "recipient-not-found" } };
  }
  // Deactivated profiles cannot receive new Tees (admin takedown).
  if (profile.deactivated_at) {
    return { ok: false, error: { kind: "recipient-not-ready" } };
  }

  // 2. The recipient's connected account must be ready, in this environment.
  const { data: accountData, error: accountError } = await supabase
    .from("stripe_connected_accounts")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();
  if (accountError) {
    logPaymentEvent("error", "checkout.account_lookup_failed", {
      reason: accountError.message,
    });
    return { ok: false, error: { kind: "unavailable" } };
  }
  const account = accountData as ConnectedAccountRow | null;
  if (!account || !canReceiveGifts(account) || account.livemode !== isLivemode()) {
    return { ok: false, error: { kind: "recipient-not-ready" } };
  }

  // 3. The gift currency must match the account's settlement currency so the
  //    destination transfer never crosses currencies.
  if (account.default_currency && input.currency !== account.default_currency) {
    return { ok: false, error: { kind: "currency-mismatch" } };
  }

  // 4. A chosen goal must be an ACTIVE goal of this recipient in the gift's
  //    currency — the goal id itself is never trusted from the browser.
  if (input.goalId) {
    const { data: goal, error: goalError } = await supabase
      .from("creator_goals")
      .select("id, creator_id, status, currency")
      .eq("id", input.goalId)
      .maybeSingle();
    if (goalError) {
      logPaymentEvent("error", "checkout.goal_lookup_failed", {
        reason: goalError.message,
      });
      return { ok: false, error: { kind: "unavailable" } };
    }
    if (
      !goal ||
      goal.creator_id !== profile.id ||
      goal.status !== "active" ||
      goal.currency !== input.currency
    ) {
      return { ok: false, error: { kind: "goal-not-available" } };
    }
  }

  // 5. Authoritative fee calculation.
  const fees = calculateFees(input.giftAmount, input.currency, getFeeConfig());
  if (!fees.ok) {
    return { ok: false, error: { kind: "amount", error: fees.error } };
  }
  const b = fees.breakdown;

  // 6. Create the pending gift before touching Stripe.
  const { data: gift, error: giftError } = await supabase
    .from("gifts")
    .insert({
      sender_user_id: senderUserId,
      recipient_user_id: profile.id,
      recipient_connected_account_id: account.id,
      goal_id: input.goalId ?? null,
      sender_name: input.senderName,
      sender_email: input.senderEmail ?? null,
      message: input.message ?? null,
      currency: b.currency,
      gift_amount: b.giftAmount,
      platform_fee_amount: b.platformFeeAmount,
      payment_handling_amount: b.paymentHandlingAmount,
      application_fee_amount: b.applicationFeeAmount,
      total_amount: b.totalChargeAmount,
      status: "draft",
      is_anonymous: input.isAnonymous,
      fee_model_version: b.feeModelVersion,
      livemode: isLivemode(),
    })
    .select("*")
    .single();
  if (giftError || !gift) {
    logPaymentEvent("error", "checkout.gift_insert_failed", {
      reason: giftError?.message ?? "no row",
    });
    return { ok: false, error: { kind: "unavailable" } };
  }
  const giftRow = gift as GiftRow;

  // 7. Create the Checkout Session (idempotent per gift).
  try {
    const stripe = getStripeClient();
    const urls = getStripeUrls();
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: giftRow.public_id,
        // MVP: cards only. Enable further methods deliberately in the Stripe
        // dashboard + here once destination-charge behaviour is confirmed.
        payment_method_types: ["card"],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: b.currency,
              unit_amount: b.totalChargeAmount,
              product_data: {
                name: `A Tee for ${profile.display_name || profile.username}`,
                description:
                  `Gift ${formatMinorAmount(b.giftAmount, b.currency)}` +
                  ` + BuyMeATee platform fee ${formatMinorAmount(b.platformFeeAmount, b.currency)}` +
                  ` + payment handling ${formatMinorAmount(b.paymentHandlingAmount, b.currency)}.` +
                  ` The recipient receives ${formatMinorAmount(b.giftAmount, b.currency)}.`,
              },
            },
          },
        ],
        payment_intent_data: {
          application_fee_amount: b.applicationFeeAmount,
          transfer_data: { destination: account.stripe_account_id },
          metadata: {
            gift_id: giftRow.id,
            gift_public_id: giftRow.public_id,
            recipient_user_id: profile.id,
            environment: isLivemode() ? "live" : "test",
            fee_model_version: b.feeModelVersion,
            ...(giftRow.goal_id ? { goal_id: giftRow.goal_id } : {}),
          },
        },
        metadata: {
          gift_id: giftRow.id,
          gift_public_id: giftRow.public_id,
          recipient_user_id: profile.id,
          environment: isLivemode() ? "live" : "test",
          fee_model_version: b.feeModelVersion,
          ...(giftRow.goal_id ? { goal_id: giftRow.goal_id } : {}),
        },
        customer_email: input.senderEmail,
        success_url: urls.checkoutSuccessUrl.replace(
          "{GIFT_PUBLIC_ID}",
          giftRow.public_id,
        ),
        cancel_url: urls.checkoutCancelUrl.replace(
          "{GIFT_PUBLIC_ID}",
          giftRow.public_id,
        ),
      },
      { idempotencyKey: `bmat-checkout-${giftRow.id}` },
    );

    const { error: updateError } = await supabase
      .from("gifts")
      .update({
        stripe_checkout_session_id: session.id,
        status: "checkout_created",
      })
      .eq("id", giftRow.id)
      .eq("status", "draft");
    if (updateError) {
      logPaymentEvent("error", "checkout.session_store_failed", {
        gift_id: giftRow.id,
        reason: updateError.message,
      });
      return { ok: false, error: { kind: "unavailable" } };
    }

    await recordGiftEvent(
      giftRow.id,
      "checkout_created",
      { stripe_checkout_session_id: session.id },
      { from: "draft", to: "checkout_created" },
    );
    logPaymentEvent("info", "checkout.session_created", {
      gift_id: giftRow.id,
      recipient_user_id: profile.id,
      currency: b.currency,
      total_amount: b.totalChargeAmount,
      livemode: isLivemode(),
    });

    if (!session.url) {
      return { ok: false, error: { kind: "unavailable" } };
    }
    return { ok: true, checkoutUrl: session.url, giftPublicId: giftRow.public_id };
  } catch (error) {
    await recordGiftEvent(giftRow.id, "checkout_creation_failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    logPaymentEvent("error", "checkout.session_create_failed", {
      gift_id: giftRow.id,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false, error: { kind: "unavailable" } };
  }
}

/** Donor-facing phases derived from the authoritative gift status. */
export type GiftPublicPhase =
  | "confirming"
  | "paid"
  | "pending"
  | "failed"
  | "expired"
  | "cancelled";

export interface GiftPublicStatus {
  phase: GiftPublicPhase;
  recipientName: string;
  recipientUsername: string | null;
  giftAmount: number;
  currency: GiftRow["currency"];
  message: string | null;
  senderName: string;
  isAnonymous: boolean;
}

function toPublicPhase(status: GiftStatus): GiftPublicPhase {
  switch (status) {
    case "paid":
    case "partially_refunded":
    case "refunded":
    case "disputed":
    case "dispute_won":
    case "dispute_lost":
      return "paid";
    case "processing":
      return "pending";
    case "payment_failed":
      return "failed";
    case "expired":
      return "expired";
    case "cancelled":
      return "cancelled";
    default:
      return "confirming";
  }
}

/**
 * Safe success-page projection, looked up by the non-guessable public id.
 * Never exposes Stripe objects, ids, emails or payout details.
 */
export async function getGiftPublicStatus(
  publicId: string,
): Promise<GiftPublicStatus | null> {
  if (!/^[0-9a-f-]{36}$/i.test(publicId)) {
    return null;
  }
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("gifts")
    .select(
      "status, sender_name, is_anonymous, message, gift_amount, currency, recipient_user_id, profiles!gifts_recipient_user_id_fkey(username, display_name)",
    )
    .eq("public_id", publicId)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  const recipient = data.profiles as unknown as {
    username: string | null;
    display_name: string;
  } | null;
  return {
    phase: toPublicPhase(data.status as GiftStatus),
    recipientName: recipient?.display_name || recipient?.username || "this golfer",
    recipientUsername: recipient?.username ?? null,
    giftAmount: data.gift_amount as number,
    currency: data.currency as GiftRow["currency"],
    message: (data.message as string | null) ?? null,
    senderName: data.sender_name as string,
    isAnonymous: data.is_anonymous as boolean,
  };
}
