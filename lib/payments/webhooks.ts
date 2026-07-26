import "server-only";

import type Stripe from "stripe";

import { isAppLocale } from "@/i18n/locales";
import {
  goalReductionForRefund,
  goalRefundDelta,
} from "@/lib/goals/contribution-math";
import { applyGoalContribution } from "@/lib/goals/contributions";
import { createGoalMilestoneDrafts } from "@/lib/journey/service";
import {
  applyMerchPaymentFailed,
  applyMerchPaymentSucceeded,
  type MerchPaidOutcome,
} from "@/lib/merch/order-payments";
import { sendGiftReceipt } from "@/lib/email/notify";
import {
  enqueueGiftReceivedNotification,
  enqueueGoalReachedNotification,
} from "@/lib/notifications/gift-notifications";
import { syncConnectedAccount } from "@/lib/payments/connect";
import { recordGiftEvent } from "@/lib/payments/gifts";
import { logPaymentEvent } from "@/lib/payments/log";
import {
  PAID_FAMILY_STATUSES,
  type ConnectedAccountRow,
  type GiftRow,
  type GiftStatus,
} from "@/lib/payments/types";
import { getStripeClient } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  markWishlistItemFunded,
  revertWishlistItemFunding,
} from "@/lib/wishlist/funding";

/**
 * Stripe event processing (ADR-009). Pure of HTTP concerns — the route
 * verifies the signature and idempotency, then hands the event here.
 *
 * Authoritative paid path: `checkout.session.completed` with
 * payment_status=paid (or `checkout.session.async_payment_succeeded`).
 * `payment_intent.succeeded` runs through the identical verification as a
 * fallback for out-of-order delivery. Every paid transition verifies amount,
 * currency, destination and application fee against the stored gift before
 * anything is marked paid; mismatches become reconciliation errors, never
 * silent success.
 */

export type ProcessOutcome = {
  status: "processed" | "skipped";
  note?: string;
};

async function loadGift(
  column: "id" | "public_id" | "stripe_checkout_session_id" | "stripe_payment_intent_id",
  value: string,
): Promise<GiftRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .eq(column, value)
    .maybeSingle();
  if (error) {
    throw new Error(`Gift lookup by ${column} failed: ${error.message}`);
  }
  return (data as GiftRow | null) ?? null;
}

async function loadAccountById(id: string): Promise<ConnectedAccountRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stripe_connected_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Connected account lookup failed: ${error.message}`);
  }
  return (data as ConnectedAccountRow | null) ?? null;
}

/** Guarded status transition: never downgrades a paid-family gift. */
export async function transitionGiftStatus(
  gift: GiftRow,
  to: GiftStatus,
  stripeEventId: string,
  extra: Record<string, unknown> = {},
): Promise<boolean> {
  if (gift.status === to) {
    return false;
  }
  if (
    PAID_FAMILY_STATUSES.includes(gift.status) &&
    !PAID_FAMILY_STATUSES.includes(to)
  ) {
    logPaymentEvent("warn", "webhook.transition_blocked", {
      gift_id: gift.id,
      from: gift.status,
      to,
      stripe_event_id: stripeEventId,
    });
    return false;
  }
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("gifts")
    .update({ status: to, ...extra })
    .eq("id", gift.id)
    .eq("status", gift.status)
    .select("id")
    .maybeSingle();
  if (error) {
    throw new Error(`Gift status update failed: ${error.message}`);
  }
  if (!data) {
    // Lost a race with another transition — the other writer wins.
    return false;
  }
  await recordGiftEvent(
    gift.id,
    "status_change",
    extra,
    { from: gift.status, to },
    stripeEventId,
  );
  return true;
}

async function flagReconciliationError(
  gift: GiftRow,
  stripeEventId: string,
  reason: string,
  detail: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  await supabase
    .from("gifts")
    .update({ reconciliation_error: reason })
    .eq("id", gift.id);
  await recordGiftEvent(
    gift.id,
    "reconciliation_error",
    { reason, ...detail },
    undefined,
    stripeEventId,
  );
  logPaymentEvent("error", "webhook.reconciliation_error", {
    gift_id: gift.id,
    stripe_event_id: stripeEventId,
    reason,
  });
}

function extractId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * The single verified paid transition. `sessionEmail` backfills the donor's
 * receipt email when Stripe collected it at checkout.
 */
export async function markGiftPaidVerified(
  gift: GiftRow,
  paymentIntent: Stripe.PaymentIntent,
  eventLivemode: boolean,
  stripeEventId: string,
  sessionEmail?: string | null,
): Promise<ProcessOutcome> {
  if (PAID_FAMILY_STATUSES.includes(gift.status)) {
    return { status: "skipped", note: "gift already paid" };
  }

  const account = await loadAccountById(gift.recipient_connected_account_id);
  const destination = extractId(
    paymentIntent.transfer_data?.destination as string | { id: string } | null,
  );

  const mismatches: string[] = [];
  if (eventLivemode !== gift.livemode) {
    mismatches.push("livemode");
  }
  if (paymentIntent.amount !== gift.total_amount) {
    mismatches.push("amount");
  }
  if (paymentIntent.currency !== gift.currency) {
    mismatches.push("currency");
  }
  if (!account || destination !== account.stripe_account_id) {
    mismatches.push("destination");
  }
  if (paymentIntent.application_fee_amount !== gift.application_fee_amount) {
    mismatches.push("application_fee");
  }
  if (
    paymentIntent.metadata?.gift_id &&
    paymentIntent.metadata.gift_id !== gift.id
  ) {
    mismatches.push("metadata_gift_id");
  }

  if (mismatches.length > 0) {
    await flagReconciliationError(
      gift,
      stripeEventId,
      `Verified Stripe object does not match stored gift: ${mismatches.join(", ")}`,
      {
        payment_intent_id: paymentIntent.id,
        stripe_amount: paymentIntent.amount,
        stripe_currency: paymentIntent.currency,
        stripe_application_fee: paymentIntent.application_fee_amount,
      },
    );
    return { status: "processed", note: "reconciliation error recorded" };
  }

  const charge = paymentIntent.latest_charge as Stripe.Charge | string | null;
  const chargeObject = typeof charge === "object" && charge ? charge : null;

  const transitioned = await transitionGiftStatus(gift, "paid", stripeEventId, {
    paid_at: new Date().toISOString(),
    stripe_payment_intent_id: paymentIntent.id,
    stripe_charge_id: chargeObject?.id ?? extractId(charge),
    stripe_transfer_id: chargeObject ? extractId(chargeObject.transfer as string | { id: string } | null) : null,
    stripe_application_fee_id: chargeObject
      ? extractId(chargeObject.application_fee as string | { id: string } | null)
      : null,
    ...(gift.sender_email === null && sessionEmail
      ? { sender_email: sessionEmail }
      : {}),
  });

  if (transitioned) {
    await enqueueGiftReceivedNotification(gift);
    // Goal progress is credited HERE and only here — behind the
    // exactly-once paid transition, so webhook replays can't double-count.
    if (gift.goal_id) {
      const credited = await applyGoalContribution(
        gift.goal_id,
        gift.gift_amount,
        {
          giftId: gift.id,
          stripeEventId,
          reason: "gift_paid",
        },
      );
      // Notify the Creator only when this gift crossed the target. Idempotent
      // and decoupled from delivery (drained by deliverPendingNotifications).
      if (credited) {
        await enqueueGoalReachedNotification(gift);
        // Seed DRAFT Journey posts for any 25/50/75/100% milestone this gift
        // crossed (Phase 2). Honest by construction — progress was just
        // credited via the verified path — never auto-published, and idempotent
        // on replay via the milestone unique index. Best-effort: a failure here
        // must never fail the payment.
        try {
          await createGoalMilestoneDrafts(gift);
        } catch (error) {
          logPaymentEvent("error", "journey.milestone_drafts_failed", {
            gift_id: gift.id,
            goal_id: gift.goal_id,
            reason: error instanceof Error ? error.message : "unknown",
          });
        }
      }
    }
    // A wish-list item is funded HERE and only here — behind the exactly-once
    // paid transition, so webhook replays can't re-fund. Guarded on the item
    // still being 'active', so a race between two funders resolves cleanly
    // (ADR-018).
    if (gift.wishlist_item_id) {
      await markWishlistItemFunded(gift.wishlist_item_id, {
        giftId: gift.id,
        stripeEventId,
      });
    }
    // Receipt to the Supporter (best-effort, never fails the payment). Not
    // queued: the Supporter may be anonymous with no profile row, and their
    // email must never live in a Creator-readable notification payload.
    const receiptEmail = gift.sender_email ?? sessionEmail ?? null;
    if (receiptEmail) {
      await sendGiftReceipt({
        creatorUserId: gift.recipient_user_id,
        amount: gift.gift_amount,
        currency: gift.currency,
        toEmail: receiptEmail,
        goalId: gift.goal_id,
        wishlistItemId: gift.wishlist_item_id,
        // Language the supporter used at checkout (null on legacy rows -> en).
        locale: isAppLocale(gift.locale) ? gift.locale : undefined,
      });
    }
    logPaymentEvent("info", "webhook.gift_paid", {
      gift_id: gift.id,
      payment_intent_id: paymentIntent.id,
      amount: gift.total_amount,
      currency: gift.currency,
      livemode: eventLivemode,
    });
  }
  return { status: "processed" };
}

async function retrievePaymentIntentWithCharge(
  paymentIntentId: string,
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient();
  return stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });
}

async function giftFromSession(
  session: Stripe.Checkout.Session,
): Promise<GiftRow | null> {
  const giftId = session.metadata?.gift_id;
  const gift = giftId
    ? await loadGift("id", giftId)
    : await loadGift("stripe_checkout_session_id", session.id);
  if (!gift) {
    return null;
  }
  // The Stripe object must identify the same gift we stored.
  if (
    gift.stripe_checkout_session_id !== session.id ||
    (session.metadata?.gift_public_id &&
      session.metadata.gift_public_id !== gift.public_id)
  ) {
    return null;
  }
  return gift;
}

async function handleCheckoutSessionCompleted(
  event: Stripe.Event,
): Promise<ProcessOutcome> {
  const session = event.data.object as Stripe.Checkout.Session;
  const gift = await giftFromSession(session);
  if (!gift) {
    logPaymentEvent("warn", "webhook.unknown_session", {
      session_id: session.id,
      stripe_event_id: event.id,
    });
    return { status: "skipped", note: "no matching gift" };
  }

  const paymentIntentId = extractId(
    session.payment_intent as string | { id: string } | null,
  );

  if (session.payment_status === "paid" && paymentIntentId) {
    const paymentIntent = await retrievePaymentIntentWithCharge(paymentIntentId);
    return markGiftPaidVerified(
      gift,
      paymentIntent,
      event.livemode,
      event.id,
      session.customer_details?.email ?? null,
    );
  }

  // Asynchronous payment method still settling.
  await transitionGiftStatus(gift, "processing", event.id, {
    stripe_payment_intent_id: paymentIntentId,
  });
  return { status: "processed", note: "payment pending" };
}

async function handleCheckoutSessionExpired(
  event: Stripe.Event,
): Promise<ProcessOutcome> {
  const session = event.data.object as Stripe.Checkout.Session;
  const gift = await giftFromSession(session);
  if (!gift) {
    return { status: "skipped", note: "no matching gift" };
  }
  await transitionGiftStatus(gift, "expired", event.id);
  return { status: "processed" };
}

async function giftFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
): Promise<GiftRow | null> {
  const giftId = paymentIntent.metadata?.gift_id;
  if (giftId) {
    const gift = await loadGift("id", giftId);
    if (gift) return gift;
  }
  return loadGift("stripe_payment_intent_id", paymentIntent.id);
}

async function handlePaymentIntentSucceeded(
  event: Stripe.Event,
): Promise<ProcessOutcome> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  // Merchandise orders are a separate domain (separate charges + transfers).
  if (paymentIntent.metadata?.order_type === "merch") {
    const full = await retrievePaymentIntentWithCharge(paymentIntent.id);
    const charge = full.latest_charge;
    const chargeObject =
      charge && typeof charge !== "string" ? charge : null;
    const outcome = await applyMerchPaymentSucceeded({
      paymentIntentId: full.id,
      metadataOrderId: full.metadata?.order_id ?? null,
      livemode: event.livemode,
      amount: full.amount,
      currency: full.currency,
      chargeId: chargeObject?.id ?? null,
      balanceTransactionId:
        chargeObject && typeof chargeObject.balance_transaction === "string"
          ? chargeObject.balance_transaction
          : null,
      transferGroup: full.transfer_group ?? null,
      eventId: event.id,
    });
    return merchOutcomeToProcessOutcome(outcome);
  }
  const gift = await giftFromPaymentIntent(paymentIntent);
  if (!gift) {
    return { status: "skipped", note: "no matching gift" };
  }
  // Re-retrieve with the charge expanded so ids can be recorded.
  const full = await retrievePaymentIntentWithCharge(paymentIntent.id);
  return markGiftPaidVerified(gift, full, event.livemode, event.id);
}

/**
 * Merch orders don't move on `processing` (they wait for succeeded/failed), and
 * a reconciliation error is flagged in the DB, not a transient failure — so it
 * maps to a 200 "skipped" rather than forcing Stripe to retry forever.
 */
function merchOutcomeToProcessOutcome(outcome: MerchPaidOutcome): ProcessOutcome {
  if (outcome.status === "processed") {
    return { status: "processed" };
  }
  if (outcome.status === "reconciliation_error") {
    return { status: "skipped", note: `merch reconciliation error: ${outcome.mismatches.join(",")}` };
  }
  return { status: "skipped", note: outcome.note };
}

async function handlePaymentIntentProcessing(
  event: Stripe.Event,
): Promise<ProcessOutcome> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  if (paymentIntent.metadata?.order_type === "merch") {
    // Merch orders wait for a definitive succeeded/failed; nothing to do here.
    return { status: "skipped", note: "merch processing" };
  }
  const gift = await giftFromPaymentIntent(paymentIntent);
  if (!gift) {
    return { status: "skipped", note: "no matching gift" };
  }
  await transitionGiftStatus(gift, "processing", event.id, {
    stripe_payment_intent_id: paymentIntent.id,
  });
  return { status: "processed" };
}

async function handlePaymentIntentFailed(
  event: Stripe.Event,
): Promise<ProcessOutcome> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  if (paymentIntent.metadata?.order_type === "merch") {
    return merchOutcomeToProcessOutcome(
      await applyMerchPaymentFailed({
        paymentIntentId: paymentIntent.id,
        metadataOrderId: paymentIntent.metadata?.order_id ?? null,
        eventId: event.id,
      }),
    );
  }
  const gift = await giftFromPaymentIntent(paymentIntent);
  if (!gift) {
    return { status: "skipped", note: "no matching gift" };
  }
  await transitionGiftStatus(gift, "payment_failed", event.id, {
    stripe_payment_intent_id: paymentIntent.id,
    failure_code: paymentIntent.last_payment_error?.code ?? null,
    failure_message: paymentIntent.last_payment_error?.message ?? null,
  });
  return { status: "processed" };
}

async function giftFromCharge(charge: Stripe.Charge): Promise<GiftRow | null> {
  const paymentIntentId = extractId(
    charge.payment_intent as string | { id: string } | null,
  );
  if (paymentIntentId) {
    const gift = await loadGift("stripe_payment_intent_id", paymentIntentId);
    if (gift) return gift;
  }
  const giftId = charge.metadata?.gift_id;
  return giftId ? loadGift("id", giftId) : null;
}

async function handleChargeRefunded(
  event: Stripe.Event,
): Promise<ProcessOutcome> {
  const charge = event.data.object as Stripe.Charge;
  const gift = await giftFromCharge(charge);
  if (!gift) {
    return { status: "skipped", note: "no matching gift" };
  }

  const supabase = getSupabaseAdminClient();
  // Captured before any update: the cumulative refund position this event
  // moves the gift FROM, used for the proportional goal withdrawal below.
  const previousAmountRefunded = gift.amount_refunded;

  // Record each refund (the object carries up to 10; ample for gift-sized payments).
  const refunds = charge.refunds?.data ?? [];
  for (const refund of refunds) {
    const { error } = await supabase.from("gift_refunds").upsert(
      {
        gift_id: gift.id,
        stripe_refund_id: refund.id,
        amount: refund.amount,
        currency: gift.currency,
        status: refund.status ?? "unknown",
        reason: refund.reason ?? null,
      },
      { onConflict: "stripe_refund_id" },
    );
    if (error) {
      throw new Error(`Refund upsert failed: ${error.message}`);
    }
  }

  const fullyRefunded = charge.amount_refunded >= gift.total_amount;
  const to: GiftStatus = fullyRefunded ? "refunded" : "partially_refunded";
  const transitioned = await transitionGiftStatus(gift, to, event.id, {
    amount_refunded: charge.amount_refunded,
    refunded_at: new Date().toISOString(),
    stripe_refund_id: refunds[0]?.id ?? gift.stripe_refund_id,
  });
  if (!transitioned && charge.amount_refunded > previousAmountRefunded) {
    // Repeat partial refund: the status stays the same, but the cumulative
    // refunded amount still advanced and must be persisted.
    await supabase
      .from("gifts")
      .update({ amount_refunded: charge.amount_refunded })
      .eq("id", gift.id)
      .eq("amount_refunded", previousAmountRefunded);
  }

  // Withdraw the refunded share of any goal credit. Computed from the
  // cumulative refund positions, so out-of-order events net out correctly;
  // route-level idempotency already blocks exact replays.
  if (gift.goal_id) {
    const delta = goalRefundDelta(
      gift.gift_amount,
      gift.total_amount,
      previousAmountRefunded,
      charge.amount_refunded,
    );
    if (delta < 0) {
      await applyGoalContribution(gift.goal_id, delta, {
        giftId: gift.id,
        stripeEventId: event.id,
        reason: fullyRefunded ? "gift_refunded" : "gift_partially_refunded",
      });
    }
  }

  // Outright wish-list funding is all-or-nothing: only a FULL refund reopens
  // the item (a partial refund leaves the item funded — the supporter still
  // paid the bulk of its price). Guarded on this gift being the funder.
  if (gift.wishlist_item_id && fullyRefunded) {
    await revertWishlistItemFunding(gift.wishlist_item_id, {
      giftId: gift.id,
      stripeEventId: event.id,
      reason: "gift_refunded",
    });
  }

  logPaymentEvent("info", "webhook.gift_refunded", {
    gift_id: gift.id,
    amount_refunded: charge.amount_refunded,
    fully_refunded: fullyRefunded,
  });
  return { status: "processed" };
}

async function handleDisputeEvent(event: Stripe.Event): Promise<ProcessOutcome> {
  const dispute = event.data.object as Stripe.Dispute;
  const charge =
    typeof dispute.charge === "string"
      ? await getStripeClient().charges.retrieve(dispute.charge)
      : dispute.charge;
  const gift = await giftFromCharge(charge);
  if (!gift) {
    logPaymentEvent("error", "webhook.dispute_unmatched", {
      dispute_id: dispute.id,
      stripe_event_id: event.id,
    });
    return { status: "skipped", note: "no matching gift" };
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("gift_disputes").upsert(
    {
      gift_id: gift.id,
      stripe_dispute_id: dispute.id,
      amount: dispute.amount,
      currency: gift.currency,
      reason: dispute.reason ?? null,
      status: dispute.status,
      evidence_due_by: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
        : null,
    },
    { onConflict: "stripe_dispute_id" },
  );
  if (error) {
    throw new Error(`Dispute upsert failed: ${error.message}`);
  }

  let to: GiftStatus = "disputed";
  if (event.type === "charge.dispute.closed") {
    to = dispute.status === "won" ? "dispute_won" : "dispute_lost";
  }
  const transitioned = await transitionGiftStatus(gift, to, event.id, {});

  // A lost dispute withdraws the funds: revert whatever goal credit is
  // still standing (refunds may already have taken part of it). Gated on
  // the exactly-once dispute_lost transition.
  if (transitioned && to === "dispute_lost" && gift.goal_id) {
    const remaining =
      gift.gift_amount -
      goalReductionForRefund(
        gift.gift_amount,
        gift.total_amount,
        gift.amount_refunded,
      );
    if (remaining > 0) {
      await applyGoalContribution(gift.goal_id, -remaining, {
        giftId: gift.id,
        stripeEventId: event.id,
        reason: "dispute_lost",
      });
    }
  }

  // A lost dispute withdraws the funds — reopen the wish-list item it funded.
  if (transitioned && to === "dispute_lost" && gift.wishlist_item_id) {
    await revertWishlistItemFunding(gift.wishlist_item_id, {
      giftId: gift.id,
      stripeEventId: event.id,
      reason: "dispute_lost",
    });
  }
  await recordGiftEvent(
    gift.id,
    "dispute",
    { dispute_id: dispute.id, dispute_status: dispute.status },
    undefined,
    event.id,
  );

  // Operational alert — destination charges make the platform liable.
  logPaymentEvent("error", "webhook.dispute_alert", {
    gift_id: gift.id,
    dispute_id: dispute.id,
    dispute_status: dispute.status,
    amount: dispute.amount,
    event_type: event.type,
  });
  return { status: "processed" };
}

async function handleApplicationFeeRefunded(
  event: Stripe.Event,
): Promise<ProcessOutcome> {
  const fee = event.data.object as Stripe.ApplicationFee;
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("gifts")
    .select("id")
    .eq("stripe_application_fee_id", fee.id)
    .maybeSingle();
  if (data) {
    await recordGiftEvent(
      data.id as string,
      "application_fee_refunded",
      { application_fee_id: fee.id, amount_refunded: fee.amount_refunded },
      undefined,
      event.id,
    );
  }
  return { status: "processed" };
}

async function handleAccountUpdated(event: Stripe.Event): Promise<ProcessOutcome> {
  const account = event.data.object as Stripe.Account;
  await syncConnectedAccount(account.id, account);
  return { status: "processed" };
}

async function handleCapabilityUpdated(
  event: Stripe.Event,
): Promise<ProcessOutcome> {
  // Connect events carry the connected account id on event.account.
  const accountId = event.account;
  if (!accountId) {
    return { status: "skipped", note: "no account context" };
  }
  await syncConnectedAccount(accountId);
  return { status: "processed" };
}

async function handlePayoutFailed(event: Stripe.Event): Promise<ProcessOutcome> {
  const accountId = event.account ?? null;
  logPaymentEvent("error", "webhook.payout_failed_alert", {
    stripe_account_id: accountId,
    stripe_event_id: event.id,
  });
  if (accountId) {
    await syncConnectedAccount(accountId);
  }
  return { status: "processed" };
}

export async function processStripeEvent(
  event: Stripe.Event,
): Promise<ProcessOutcome> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return handleCheckoutSessionCompleted(event);
    case "checkout.session.async_payment_failed":
      return handlePaymentIntentFailedFromSession(event);
    case "checkout.session.expired":
      return handleCheckoutSessionExpired(event);
    case "payment_intent.succeeded":
      return handlePaymentIntentSucceeded(event);
    case "payment_intent.processing":
      return handlePaymentIntentProcessing(event);
    case "payment_intent.payment_failed":
      return handlePaymentIntentFailed(event);
    case "charge.refunded":
      return handleChargeRefunded(event);
    case "charge.dispute.created":
    case "charge.dispute.updated":
    case "charge.dispute.closed":
      return handleDisputeEvent(event);
    case "application_fee.refunded":
      return handleApplicationFeeRefunded(event);
    case "account.updated":
      return handleAccountUpdated(event);
    case "capability.updated":
      return handleCapabilityUpdated(event);
    case "payout.failed":
      return handlePayoutFailed(event);
    default:
      return { status: "skipped", note: `unhandled event type ${event.type}` };
  }
}

async function handlePaymentIntentFailedFromSession(
  event: Stripe.Event,
): Promise<ProcessOutcome> {
  const session = event.data.object as Stripe.Checkout.Session;
  const gift = await giftFromSession(session);
  if (!gift) {
    return { status: "skipped", note: "no matching gift" };
  }
  await transitionGiftStatus(gift, "payment_failed", event.id);
  return { status: "processed" };
}

/** Compact, privacy-safe summary persisted with the webhook event record. */
export function summariseEvent(event: Stripe.Event): Record<string, unknown> {
  const object = event.data.object as { id?: string; object?: string };
  return {
    object_id: object.id ?? null,
    object_type: object.object ?? null,
    connect_account: event.account ?? null,
  };
}
