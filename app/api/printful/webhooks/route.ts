import { NextResponse } from "next/server";

import { applyPrintfulWebhookEvent } from "@/lib/merch/printful-fulfilment";
import { getPrintfulWebhookSecret } from "@/lib/printful/config";
import {
  parseWebhookPayload,
  verifyWebhookSecret,
} from "@/lib/printful/webhooks";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Printful webhook endpoint (ADR-024, spec §21).
 *
 * Printful API v1 does not sign webhooks, so protection is layered:
 *   1. A shared secret in the URL (?secret=…), compared in constant time.
 *   2. A payload-size limit + strict schema validation.
 *   3. A derived stable event id claimed in printful_webhook_events (idempotency).
 *   4. Guarded, idempotent processing; failures return 500 so Printful retries.
 *
 * Configure the webhook URL in Printful as:
 *   https://buymeatee.com/api/printful/webhooks?secret=<PRINTFUL_WEBHOOK_SECRET>
 */
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 256 * 1024;

export async function POST(request: Request) {
  const configuredSecret = getPrintfulWebhookSecret();
  const providedSecret = new URL(request.url).searchParams.get("secret");
  if (!verifyWebhookSecret(providedSecret, configuredSecret)) {
    // Fail safe: also rejects when no secret is configured at all.
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rawBody = await request.text();
  const parsed = parseWebhookPayload(rawBody, MAX_BODY_BYTES);
  if (!parsed.ok) {
    const status = parsed.error === "too-large" ? 413 : 400;
    return NextResponse.json({ error: parsed.error }, { status });
  }
  const event = parsed.event;

  const supabase = getSupabaseAdminClient();

  // Claim the event id. A unique violation means a duplicate delivery.
  const { error: insertError } = await supabase
    .from("printful_webhook_events")
    .insert({
      provider: "printful",
      external_event_id: event.externalEventId,
      event_type: event.rawType,
      payload: { kind: event.kind, externalId: event.externalId, printfulOrderId: event.printfulOrderId },
      processing_status: "processing",
    });

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: existing } = await supabase
        .from("printful_webhook_events")
        .select("processing_status, processing_attempts")
        .eq("provider", "printful")
        .eq("external_event_id", event.externalEventId)
        .maybeSingle();
      if (!existing || existing.processing_status !== "failed") {
        return NextResponse.json({ received: true, duplicate: true });
      }
      await supabase
        .from("printful_webhook_events")
        .update({
          processing_status: "processing",
          processing_attempts: ((existing.processing_attempts as number) ?? 1) + 1,
        })
        .eq("provider", "printful")
        .eq("external_event_id", event.externalEventId);
    } else {
      return NextResponse.json({ error: "Storage failure." }, { status: 500 });
    }
  }

  try {
    const outcome = await applyPrintfulWebhookEvent(event);
    await supabase
      .from("printful_webhook_events")
      .update({
        processing_status: outcome.status === "processed" ? "processed" : "skipped",
        last_error: null,
        processed_at: new Date().toISOString(),
      })
      .eq("provider", "printful")
      .eq("external_event_id", event.externalEventId);
    return NextResponse.json({ received: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    await supabase
      .from("printful_webhook_events")
      .update({ processing_status: "failed", last_error: reason })
      .eq("provider", "printful")
      .eq("external_event_id", event.externalEventId);
    // Non-2xx → Printful retries.
    return NextResponse.json({ error: "Processing failure." }, { status: 500 });
  }
}
