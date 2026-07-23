import "server-only";

import type Stripe from "stripe";

import { goalReductionForRefund } from "@/lib/goals/contribution-math";
import { logPaymentEvent } from "@/lib/payments/log";
import { PAID_FAMILY_STATUSES, type GiftRow } from "@/lib/payments/types";
import {
  markGiftPaidVerified,
  transitionGiftStatus,
} from "@/lib/payments/webhooks";
import { getStripeClient, isLivemode } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Reconciliation (ADR-009): finds gifts stuck before a terminal state,
 * retrieves the truth from Stripe and repairs safe drift through the same
 * verified transition used by webhooks — so notifications stay idempotent and
 * mismatches are flagged, never silently "fixed". Recovery never depends on
 * replaying webhooks by hand.
 */

const STUCK_AFTER_MS = 60 * 60 * 1000; // 1 hour
const DRAFT_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface ReconciliationReport {
  scanned: number;
  markedPaid: number;
  markedExpired: number;
  markedFailed: number;
  cancelledDrafts: number;
  stillPending: number;
  flagged: string[]; // gift public ids needing manual review
}

export async function reconcileStuckGifts(): Promise<ReconciliationReport> {
  const supabase = getSupabaseAdminClient();
  const cutoff = new Date(Date.now() - STUCK_AFTER_MS).toISOString();
  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .in("status", ["draft", "checkout_created", "processing"])
    .eq("livemode", isLivemode())
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) {
    throw new Error(`Reconciliation query failed: ${error.message}`);
  }

  const report: ReconciliationReport = {
    scanned: 0,
    markedPaid: 0,
    markedExpired: 0,
    markedFailed: 0,
    cancelledDrafts: 0,
    stillPending: 0,
    flagged: [],
  };

  const stripe = getStripeClient();
  for (const row of (data ?? []) as GiftRow[]) {
    report.scanned += 1;
    try {
      if (row.status === "draft") {
        // Checkout Session creation failed after insert; close out old drafts.
        if (Date.now() - new Date(row.created_at).getTime() > DRAFT_EXPIRY_MS) {
          await transitionGiftStatus(row, "cancelled", "reconciliation");
          report.cancelledDrafts += 1;
        } else {
          report.stillPending += 1;
        }
        continue;
      }

      if (!row.stripe_checkout_session_id) {
        report.flagged.push(row.public_id);
        continue;
      }

      const session = await stripe.checkout.sessions.retrieve(
        row.stripe_checkout_session_id,
        { expand: ["payment_intent.latest_charge"] },
      );

      if (session.payment_status === "paid" && session.payment_intent) {
        const paymentIntent = session.payment_intent as Stripe.PaymentIntent;
        const outcome = await markGiftPaidVerified(
          row,
          paymentIntent,
          session.livemode,
          "reconciliation",
          session.customer_details?.email ?? null,
        );
        if (outcome.note === "reconciliation error recorded") {
          report.flagged.push(row.public_id);
        } else {
          report.markedPaid += 1;
        }
      } else if (session.status === "expired") {
        await transitionGiftStatus(row, "expired", "reconciliation");
        report.markedExpired += 1;
      } else if (
        session.payment_intent &&
        typeof session.payment_intent === "object" &&
        session.payment_intent.status === "canceled"
      ) {
        await transitionGiftStatus(row, "payment_failed", "reconciliation");
        report.markedFailed += 1;
      } else {
        report.stillPending += 1;
      }
    } catch (rowError) {
      report.flagged.push(row.public_id);
      logPaymentEvent("error", "reconciliation.row_failed", {
        gift_id: row.id,
        reason: rowError instanceof Error ? rowError.message : "unknown",
      });
    }
  }

  logPaymentEvent("info", "reconciliation.completed", {
    scanned: report.scanned,
    marked_paid: report.markedPaid,
    marked_expired: report.markedExpired,
    cancelled_drafts: report.cancelledDrafts,
    flagged: report.flagged.length,
  });
  return report;
}

export interface GoalProgressReport {
  checked: number;
  /** Goals whose raised_amount disagrees with their attributed gifts. */
  drifted: Array<{
    goalId: string;
    storedRaised: number;
    expectedRaised: number;
  }>;
}

/**
 * Cross-check every goal's denormalised raised_amount against the standing
 * credit of its attributed gifts (ADR-011): paid-family gifts count their
 * gift amount minus the refunded share; lost disputes count zero. Drift is
 * reported for manual review — never silently corrected, because either
 * side of the disagreement could be the wrong one.
 */
export async function reconcileGoalProgress(): Promise<GoalProgressReport> {
  const supabase = getSupabaseAdminClient();
  const report: GoalProgressReport = { checked: 0, drifted: [] };

  const { data: goals, error: goalsError } = await supabase
    .from("creator_goals")
    .select("id, raised_amount")
    .order("created_at", { ascending: true })
    .limit(500);
  if (goalsError) {
    throw new Error(`Goal reconciliation query failed: ${goalsError.message}`);
  }

  for (const goal of (goals ?? []) as Array<{ id: string; raised_amount: number }>) {
    report.checked += 1;
    const { data: gifts, error: giftsError } = await supabase
      .from("gifts")
      .select("gift_amount, total_amount, amount_refunded, status")
      .eq("goal_id", goal.id);
    if (giftsError) {
      throw new Error(`Goal gifts query failed: ${giftsError.message}`);
    }

    let expected = 0;
    for (const gift of (gifts ?? []) as Array<
      Pick<GiftRow, "gift_amount" | "total_amount" | "amount_refunded" | "status">
    >) {
      if (!PAID_FAMILY_STATUSES.includes(gift.status) || gift.status === "dispute_lost") {
        continue;
      }
      expected +=
        gift.gift_amount -
        goalReductionForRefund(
          gift.gift_amount,
          gift.total_amount,
          gift.amount_refunded,
        );
    }

    if (expected !== goal.raised_amount) {
      report.drifted.push({
        goalId: goal.id,
        storedRaised: goal.raised_amount,
        expectedRaised: expected,
      });
      logPaymentEvent("error", "reconciliation.goal_drift", {
        goal_id: goal.id,
        stored_raised: goal.raised_amount,
        expected_raised: expected,
      });
    }
  }

  logPaymentEvent("info", "reconciliation.goals_completed", {
    checked: report.checked,
    drifted: report.drifted.length,
  });
  return report;
}
