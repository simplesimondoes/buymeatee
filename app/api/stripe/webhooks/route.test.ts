import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/stripe/webhooks/route";

/**
 * Webhook route tests: real Stripe signature construction/verification, the
 * idempotency ledger and livemode separation. Event *processing* is mocked —
 * covered by lib/payments/webhooks.test.ts.
 */

const WEBHOOK_SECRET = "whsec_test_secret";

const processStripeEvent = vi.fn();
let ledger: Record<string, unknown>[];

vi.mock("@/lib/payments/webhooks", () => ({
  processStripeEvent: (...args: unknown[]) => processStripeEvent(...args),
  summariseEvent: () => ({}),
}));
vi.mock("@/lib/payments/log", () => ({ logPaymentEvent: vi.fn() }));
vi.mock("@/lib/stripe/server", () => ({
  getStripeClient: () => new Stripe("sk_test_dummy"),
  getWebhookSecret: () => WEBHOOK_SECRET,
  isLivemode: () => false,
}));
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table !== "stripe_webhook_events") {
        throw new Error(`Unexpected table ${table}`);
      }
      const filters: [string, unknown][] = [];
      const state = { op: "select", payload: undefined as unknown };
      const builder = {
        insert(payload: Record<string, unknown>) {
          state.op = "insert";
          state.payload = payload;
          return builder;
        },
        update(payload: Record<string, unknown>) {
          state.op = "update";
          state.payload = payload;
          return builder;
        },
        select() {
          return builder;
        },
        eq(column: string, value: unknown) {
          filters.push([column, value]);
          return builder;
        },
        maybeSingle: async () => {
          const row = ledger.find((entry) =>
            filters.every(([column, value]) => entry[column] === value),
          );
          return { data: row ?? null, error: null };
        },
        then(resolve: (value: unknown) => unknown) {
          if (state.op === "insert") {
            const payload = state.payload as Record<string, unknown>;
            if (
              ledger.some(
                (entry) => entry.stripe_event_id === payload.stripe_event_id,
              )
            ) {
              return resolve({
                error: { code: "23505", message: "duplicate key" },
              });
            }
            // Mirror the column default the real table applies.
            ledger.push({ attempt_count: 1, ...payload });
            return resolve({ error: null });
          }
          if (state.op === "update") {
            for (const entry of ledger) {
              if (filters.every(([column, value]) => entry[column] === value)) {
                Object.assign(entry, state.payload as Record<string, unknown>);
              }
            }
            return resolve({ error: null });
          }
          return resolve({ data: [], error: null });
        },
      };
      return builder;
    },
  }),
}));

function eventPayload(id: string, livemode = false): string {
  return JSON.stringify({
    id,
    object: "event",
    type: "checkout.session.completed",
    livemode,
    api_version: "2026-01-01",
    data: { object: { id: "cs_1", object: "checkout.session" } },
  });
}

function signedRequest(payload: string): Request {
  const stripe = new Stripe("sk_test_dummy");
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
  });
  return new Request("https://buymeatee.com/api/stripe/webhooks", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body: payload,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  ledger = [];
  processStripeEvent.mockResolvedValue({ status: "processed" });
});

describe("POST /api/stripe/webhooks", () => {
  it("accepts a validly signed event and records it processed", async () => {
    const response = await POST(signedRequest(eventPayload("evt_a")));
    expect(response.status).toBe(200);
    expect(processStripeEvent).toHaveBeenCalledTimes(1);
    expect(ledger[0]).toMatchObject({
      stripe_event_id: "evt_a",
      status: "processed",
    });
  });

  it("rejects a bad signature with 400 and never processes", async () => {
    const request = new Request("https://buymeatee.com/api/stripe/webhooks", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=invalid" },
      body: eventPayload("evt_b"),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(processStripeEvent).not.toHaveBeenCalled();
  });

  it("rejects a missing signature with 400", async () => {
    const request = new Request("https://buymeatee.com/api/stripe/webhooks", {
      method: "POST",
      body: eventPayload("evt_c"),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rejects a tampered body (signature no longer matches)", async () => {
    const original = eventPayload("evt_d");
    const stripe = new Stripe("sk_test_dummy");
    const signature = stripe.webhooks.generateTestHeaderString({
      payload: original,
      secret: WEBHOOK_SECRET,
    });
    const request = new Request("https://buymeatee.com/api/stripe/webhooks", {
      method: "POST",
      headers: { "stripe-signature": signature },
      body: original.replace('"cs_1"', '"cs_2"'),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(processStripeEvent).not.toHaveBeenCalled();
  });

  it("processes duplicate deliveries only once", async () => {
    await POST(signedRequest(eventPayload("evt_e")));
    const second = await POST(signedRequest(eventPayload("evt_e")));
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ duplicate: true });
    expect(processStripeEvent).toHaveBeenCalledTimes(1);
  });

  it("retries events whose previous attempt failed", async () => {
    processStripeEvent.mockRejectedValueOnce(new Error("boom"));
    const first = await POST(signedRequest(eventPayload("evt_f")));
    expect(first.status).toBe(500); // Stripe will retry
    expect(ledger[0]).toMatchObject({ status: "failed" });

    processStripeEvent.mockResolvedValueOnce({ status: "processed" });
    const second = await POST(signedRequest(eventPayload("evt_f")));
    expect(second.status).toBe(200);
    expect(ledger[0]).toMatchObject({ status: "processed", attempt_count: 2 });
  });

  it("refuses live events on a test-mode key", async () => {
    const response = await POST(signedRequest(eventPayload("evt_g", true)));
    expect(response.status).toBe(200); // acknowledged, never processed
    expect(await response.json()).toMatchObject({ skipped: "livemode-mismatch" });
    expect(processStripeEvent).not.toHaveBeenCalled();
    expect(ledger).toHaveLength(0);
  });
});
