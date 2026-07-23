import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { logPaymentEvent } from "@/lib/payments/log";
import { processStripeEvent, summariseEvent } from "@/lib/payments/webhooks";
import {
  getStripeClient,
  getWebhookSecret,
  isLivemode,
} from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe webhook endpoint (test and live use separate endpoints + secrets).
 *
 * Order of operations:
 *   1. Verify the signature against the raw body — reject otherwise.
 *   2. Refuse events whose livemode doesn't match this environment's key.
 *   3. Claim the event id in stripe_webhook_events (idempotency).
 *   4. Process; record processed/failed. Failures return 500 so Stripe retries.
 *
 * Redirects and browsers never reach payment state — only this verified path.
 */
export async function POST(request: Request) {
  let event: Stripe.Event;
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature." }, { status: 400 });
    }
    const rawBody = await request.text();
    event = await getStripeClient().webhooks.constructEventAsync(
      rawBody,
      signature,
      getWebhookSecret(),
    );
  } catch (error) {
    logPaymentEvent("warn", "webhook.signature_rejected", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Never process live events with test configuration or vice versa.
  if (event.livemode !== isLivemode()) {
    logPaymentEvent("error", "webhook.livemode_mismatch", {
      stripe_event_id: event.id,
      event_livemode: event.livemode,
      key_livemode: isLivemode(),
    });
    return NextResponse.json({ received: true, skipped: "livemode-mismatch" });
  }

  const supabase = getSupabaseAdminClient();

  // Claim the event id. A unique violation means a duplicate delivery.
  const { error: insertError } = await supabase
    .from("stripe_webhook_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      stripe_account_id: event.account ?? null,
      api_version: event.api_version ?? null,
      livemode: event.livemode,
      status: "processing",
      summary: summariseEvent(event),
    });

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: existing } = await supabase
        .from("stripe_webhook_events")
        .select("status, attempt_count")
        .eq("stripe_event_id", event.id)
        .maybeSingle();
      if (!existing || existing.status !== "failed") {
        // Already processed / skipped / currently in flight: acknowledge.
        return NextResponse.json({ received: true, duplicate: true });
      }
      // Previous attempt failed — retry it.
      await supabase
        .from("stripe_webhook_events")
        .update({
          status: "processing",
          attempt_count: (existing.attempt_count as number) + 1,
        })
        .eq("stripe_event_id", event.id);
    } else {
      logPaymentEvent("error", "webhook.ledger_write_failed", {
        stripe_event_id: event.id,
        reason: insertError.message,
      });
      return NextResponse.json({ error: "Storage failure." }, { status: 500 });
    }
  }

  try {
    const outcome = await processStripeEvent(event);
    await supabase
      .from("stripe_webhook_events")
      .update({
        status: outcome.status === "processed" ? "processed" : "skipped",
        last_error: null,
        processed_at: new Date().toISOString(),
      })
      .eq("stripe_event_id", event.id);
    logPaymentEvent("info", "webhook.processed", {
      stripe_event_id: event.id,
      event_type: event.type,
      outcome: outcome.status,
      note: outcome.note,
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    await supabase
      .from("stripe_webhook_events")
      .update({ status: "failed", last_error: reason })
      .eq("stripe_event_id", event.id);
    logPaymentEvent("error", "webhook.processing_failed", {
      stripe_event_id: event.id,
      event_type: event.type,
      reason,
    });
    // Non-2xx → Stripe retries with backoff.
    return NextResponse.json({ error: "Processing failure." }, { status: 500 });
  }
}
