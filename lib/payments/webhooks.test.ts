import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

import { processStripeEvent } from "@/lib/payments/webhooks";

/**
 * Webhook processing tests over an in-memory Supabase fake: verified paid
 * transitions, mismatch flagging, idempotent notifications, refunds,
 * disputes and Connect account sync.
 */

type Row = Record<string, unknown>;

function createFakeSupabase(tables: Record<string, Row[]>) {
  function from(table: string) {
    const state = {
      op: "select" as "select" | "insert" | "update" | "upsert",
      payload: undefined as unknown,
      filters: [] as [string, unknown][],
    };
    const rows = () => (tables[table] ??= []);
    const matches = (row: Row) =>
      state.filters.every(([column, value]) => row[column] === value);

    function finish(single: boolean) {
      if (state.op === "insert" || state.op === "upsert") {
        const inserted = [state.payload].flat() as Row[];
        rows().push(...inserted);
        return { data: single ? inserted[0] : inserted, error: null };
      }
      if (state.op === "update") {
        const matched = rows().filter(matches);
        for (const row of matched) {
          Object.assign(row, state.payload as Row);
        }
        return { data: single ? (matched[0] ?? null) : matched, error: null };
      }
      const matched = rows().filter(matches);
      return { data: single ? (matched[0] ?? null) : matched, error: null };
    }

    const builder = {
      select: () => builder,
      insert: (payload: unknown) => {
        state.op = "insert";
        state.payload = payload;
        return builder;
      },
      update: (payload: unknown) => {
        state.op = "update";
        state.payload = payload;
        return builder;
      },
      upsert: (payload: unknown) => {
        state.op = "upsert";
        state.payload = payload;
        return builder;
      },
      eq: (column: string, value: unknown) => {
        state.filters.push([column, value]);
        return builder;
      },
      in: () => builder,
      lt: () => builder,
      not: () => builder,
      order: () => builder,
      limit: () => builder,
      maybeSingle: async () => finish(true),
      single: async () => finish(true),
      // Awaiting the builder directly (insert/upsert paths).
      then: (resolve: (value: unknown) => unknown) => resolve(finish(false)),
    };
    return builder;
  }

  // Mirrors apply_goal_contribution(): atomic delta with a >= 0 constraint.
  async function rpc(fn: string, args: Record<string, unknown>) {
    if (fn !== "apply_goal_contribution") {
      return { data: null, error: { message: `unknown function ${fn}` } };
    }
    const goal = (tables["creator_goals"] ?? []).find(
      (row) => row.id === args.p_goal_id,
    );
    if (!goal) {
      return { data: null, error: { message: "goal not found" } };
    }
    const next = (goal.raised_amount as number) + (args.p_delta as number);
    if (next < 0) {
      return { data: null, error: { message: "raised_amount check violated" } };
    }
    goal.raised_amount = next;
    return { data: next, error: null };
  }

  return { from, rpc };
}

const retrievePaymentIntent = vi.fn();
const retrieveCharge = vi.fn();
const syncConnectedAccount = vi.fn();
const enqueueNotification = vi.fn();

let tables: Record<string, Row[]>;

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => createFakeSupabase(tables),
}));
vi.mock("@/lib/stripe/server", () => ({
  getStripeClient: () => ({
    paymentIntents: { retrieve: retrievePaymentIntent },
    charges: { retrieve: retrieveCharge },
  }),
  isLivemode: () => false,
  getWebhookSecret: () => "whsec_test",
}));
vi.mock("@/lib/payments/connect", () => ({
  syncConnectedAccount: (...args: unknown[]) => syncConnectedAccount(...args),
}));
vi.mock("@/lib/notifications/gift-notifications", () => ({
  enqueueGiftReceivedNotification: (...args: unknown[]) =>
    enqueueNotification(...args),
}));
vi.mock("@/lib/payments/log", () => ({ logPaymentEvent: vi.fn() }));

const GIFT_ID = "11111111-1111-4111-8111-111111111111";
const PUBLIC_ID = "22222222-2222-4222-8222-222222222222";
const ACCOUNT_ROW_ID = "33333333-3333-4333-8333-333333333333";

function baseGift(overrides: Row = {}): Row {
  return {
    id: GIFT_ID,
    public_id: PUBLIC_ID,
    recipient_user_id: "user-1",
    recipient_connected_account_id: ACCOUNT_ROW_ID,
    sender_name: "Alex",
    sender_email: null,
    message: "Nice round!",
    currency: "gbp",
    gift_amount: 500,
    platform_fee_amount: 25,
    payment_handling_amount: 29,
    application_fee_amount: 54,
    total_amount: 554,
    amount_refunded: 0,
    status: "checkout_created",
    is_anonymous: false,
    livemode: false,
    stripe_checkout_session_id: "cs_test_123",
    stripe_payment_intent_id: null,
    stripe_refund_id: null,
    ...overrides,
  };
}

function paymentIntent(overrides: Partial<Stripe.PaymentIntent> = {}) {
  return {
    id: "pi_test_123",
    amount: 554,
    currency: "gbp",
    application_fee_amount: 54,
    transfer_data: { destination: "acct_recipient" },
    metadata: { gift_id: GIFT_ID, gift_public_id: PUBLIC_ID },
    latest_charge: {
      id: "ch_test_123",
      transfer: "tr_test_123",
      application_fee: "fee_test_123",
    },
    ...overrides,
  } as unknown as Stripe.PaymentIntent;
}

function sessionCompletedEvent(overrides: Row = {}): Stripe.Event {
  return {
    id: "evt_1",
    type: "checkout.session.completed",
    livemode: false,
    data: {
      object: {
        id: "cs_test_123",
        object: "checkout.session",
        payment_status: "paid",
        payment_intent: "pi_test_123",
        metadata: { gift_id: GIFT_ID, gift_public_id: PUBLIC_ID },
        customer_details: { email: "donor@example.com" },
        ...overrides,
      },
    },
  } as unknown as Stripe.Event;
}

beforeEach(() => {
  vi.clearAllMocks();
  tables = {
    gifts: [baseGift()],
    stripe_connected_accounts: [
      { id: ACCOUNT_ROW_ID, stripe_account_id: "acct_recipient" },
    ],
    gift_events: [],
    gift_refunds: [],
    gift_disputes: [],
    creator_goals: [],
  };
  retrievePaymentIntent.mockResolvedValue(paymentIntent());
});

describe("checkout.session.completed", () => {
  it("marks the gift paid after full verification and enqueues one notification", async () => {
    const outcome = await processStripeEvent(sessionCompletedEvent());
    expect(outcome.status).toBe("processed");

    const gift = tables.gifts[0];
    expect(gift.status).toBe("paid");
    expect(gift.stripe_payment_intent_id).toBe("pi_test_123");
    expect(gift.stripe_charge_id).toBe("ch_test_123");
    expect(gift.stripe_transfer_id).toBe("tr_test_123");
    expect(gift.stripe_application_fee_id).toBe("fee_test_123");
    expect(gift.sender_email).toBe("donor@example.com");
    expect(gift.paid_at).toBeTruthy();
    expect(enqueueNotification).toHaveBeenCalledTimes(1);
  });

  it("is idempotent: a duplicate delivery neither re-transitions nor re-notifies", async () => {
    await processStripeEvent(sessionCompletedEvent());
    const outcome = await processStripeEvent(sessionCompletedEvent());
    expect(outcome).toEqual({ status: "skipped", note: "gift already paid" });
    expect(enqueueNotification).toHaveBeenCalledTimes(1);
  });

  it("flags an amount mismatch instead of marking paid", async () => {
    retrievePaymentIntent.mockResolvedValue(paymentIntent({ amount: 999 }));
    const outcome = await processStripeEvent(sessionCompletedEvent());
    expect(outcome.note).toBe("reconciliation error recorded");

    const gift = tables.gifts[0];
    expect(gift.status).toBe("checkout_created");
    expect(String(gift.reconciliation_error)).toContain("amount");
    expect(enqueueNotification).not.toHaveBeenCalled();
  });

  it("flags a currency mismatch", async () => {
    retrievePaymentIntent.mockResolvedValue(paymentIntent({ currency: "eur" }));
    await processStripeEvent(sessionCompletedEvent());
    expect(String(tables.gifts[0].reconciliation_error)).toContain("currency");
    expect(tables.gifts[0].status).toBe("checkout_created");
  });

  it("flags a destination mismatch (substituted Stripe account)", async () => {
    retrievePaymentIntent.mockResolvedValue(
      paymentIntent({
        transfer_data: { destination: "acct_attacker" },
      } as Partial<Stripe.PaymentIntent>),
    );
    await processStripeEvent(sessionCompletedEvent());
    expect(String(tables.gifts[0].reconciliation_error)).toContain("destination");
    expect(tables.gifts[0].status).toBe("checkout_created");
  });

  it("flags an application-fee mismatch", async () => {
    retrievePaymentIntent.mockResolvedValue(
      paymentIntent({ application_fee_amount: 1 }),
    );
    await processStripeEvent(sessionCompletedEvent());
    expect(String(tables.gifts[0].reconciliation_error)).toContain(
      "application_fee",
    );
  });

  it("flags a livemode mismatch between event and stored gift", async () => {
    const event = sessionCompletedEvent();
    (event as unknown as Row).livemode = true;
    await processStripeEvent(event);
    expect(String(tables.gifts[0].reconciliation_error)).toContain("livemode");
    expect(tables.gifts[0].status).toBe("checkout_created");
  });

  it("holds asynchronous payments in processing", async () => {
    const outcome = await processStripeEvent(
      sessionCompletedEvent({ payment_status: "unpaid" }),
    );
    expect(outcome.note).toBe("payment pending");
    expect(tables.gifts[0].status).toBe("processing");
  });

  it("skips sessions that match no gift", async () => {
    tables.gifts = [];
    const outcome = await processStripeEvent(sessionCompletedEvent());
    expect(outcome.status).toBe("skipped");
  });
});

describe("out-of-order delivery", () => {
  it("payment_intent.succeeded arriving first still verifies and pays", async () => {
    const event = {
      id: "evt_pi",
      type: "payment_intent.succeeded",
      livemode: false,
      data: { object: paymentIntent() },
    } as unknown as Stripe.Event;
    const outcome = await processStripeEvent(event);
    expect(outcome.status).toBe("processed");
    expect(tables.gifts[0].status).toBe("paid");

    // The later session.completed is then a no-op.
    const second = await processStripeEvent(sessionCompletedEvent());
    expect(second.note).toBe("gift already paid");
    expect(enqueueNotification).toHaveBeenCalledTimes(1);
  });
});

describe("failure and expiry", () => {
  it("records payment failure with the decline code", async () => {
    const event = {
      id: "evt_fail",
      type: "payment_intent.payment_failed",
      livemode: false,
      data: {
        object: {
          ...paymentIntent(),
          last_payment_error: { code: "card_declined", message: "Declined." },
        },
      },
    } as unknown as Stripe.Event;
    await processStripeEvent(event);
    expect(tables.gifts[0].status).toBe("payment_failed");
    expect(tables.gifts[0].failure_code).toBe("card_declined");
  });

  it("marks expired sessions expired", async () => {
    const event = {
      id: "evt_exp",
      type: "checkout.session.expired",
      livemode: false,
      data: {
        object: {
          id: "cs_test_123",
          object: "checkout.session",
          metadata: { gift_id: GIFT_ID, gift_public_id: PUBLIC_ID },
        },
      },
    } as unknown as Stripe.Event;
    await processStripeEvent(event);
    expect(tables.gifts[0].status).toBe("expired");
  });

  it("never downgrades a paid gift (out-of-order expiry)", async () => {
    tables.gifts = [baseGift({ status: "paid" })];
    const event = {
      id: "evt_exp2",
      type: "checkout.session.expired",
      livemode: false,
      data: {
        object: {
          id: "cs_test_123",
          object: "checkout.session",
          metadata: { gift_id: GIFT_ID, gift_public_id: PUBLIC_ID },
        },
      },
    } as unknown as Stripe.Event;
    await processStripeEvent(event);
    expect(tables.gifts[0].status).toBe("paid");
  });
});

describe("refunds", () => {
  it("records a full refund and updates the gift", async () => {
    tables.gifts = [
      baseGift({ status: "paid", stripe_payment_intent_id: "pi_test_123" }),
    ];
    const event = {
      id: "evt_ref",
      type: "charge.refunded",
      livemode: false,
      data: {
        object: {
          id: "ch_test_123",
          object: "charge",
          payment_intent: "pi_test_123",
          amount_refunded: 554,
          refunds: {
            data: [{ id: "re_1", amount: 554, status: "succeeded", reason: null }],
          },
          metadata: { gift_id: GIFT_ID },
        },
      },
    } as unknown as Stripe.Event;
    await processStripeEvent(event);
    expect(tables.gifts[0].status).toBe("refunded");
    expect(tables.gifts[0].amount_refunded).toBe(554);
    expect(tables.gift_refunds).toHaveLength(1);
    expect(tables.gift_refunds[0].stripe_refund_id).toBe("re_1");
  });

  it("marks partial refunds as partially_refunded", async () => {
    tables.gifts = [
      baseGift({ status: "paid", stripe_payment_intent_id: "pi_test_123" }),
    ];
    const event = {
      id: "evt_ref2",
      type: "charge.refunded",
      livemode: false,
      data: {
        object: {
          id: "ch_test_123",
          object: "charge",
          payment_intent: "pi_test_123",
          amount_refunded: 100,
          refunds: {
            data: [{ id: "re_2", amount: 100, status: "succeeded", reason: null }],
          },
          metadata: { gift_id: GIFT_ID },
        },
      },
    } as unknown as Stripe.Event;
    await processStripeEvent(event);
    expect(tables.gifts[0].status).toBe("partially_refunded");
    expect(tables.gifts[0].amount_refunded).toBe(100);
  });
});

describe("disputes", () => {
  it("stores the dispute, marks the gift disputed and alerts", async () => {
    tables.gifts = [
      baseGift({ status: "paid", stripe_payment_intent_id: "pi_test_123" }),
    ];
    const event = {
      id: "evt_disp",
      type: "charge.dispute.created",
      livemode: false,
      data: {
        object: {
          id: "dp_1",
          object: "dispute",
          amount: 554,
          reason: "fraudulent",
          status: "needs_response",
          charge: {
            id: "ch_test_123",
            payment_intent: "pi_test_123",
            metadata: { gift_id: GIFT_ID },
          },
          evidence_details: { due_by: 1_800_000_000 },
        },
      },
    } as unknown as Stripe.Event;
    await processStripeEvent(event);
    expect(tables.gifts[0].status).toBe("disputed");
    expect(tables.gift_disputes).toHaveLength(1);
    expect(tables.gift_disputes[0].stripe_dispute_id).toBe("dp_1");
  });

  it("closes disputes as won or lost", async () => {
    tables.gifts = [
      baseGift({ status: "disputed", stripe_payment_intent_id: "pi_test_123" }),
    ];
    const event = {
      id: "evt_disp2",
      type: "charge.dispute.closed",
      livemode: false,
      data: {
        object: {
          id: "dp_1",
          object: "dispute",
          amount: 554,
          reason: "fraudulent",
          status: "won",
          charge: {
            id: "ch_test_123",
            payment_intent: "pi_test_123",
            metadata: { gift_id: GIFT_ID },
          },
        },
      },
    } as unknown as Stripe.Event;
    await processStripeEvent(event);
    expect(tables.gifts[0].status).toBe("dispute_won");
  });
});

describe("goal attribution", () => {
  const GOAL_ID = "44444444-4444-4444-8444-444444444444";

  function seedGoal(raised = 0) {
    tables.creator_goals = [
      { id: GOAL_ID, creator_id: "user-1", raised_amount: raised },
    ];
  }

  function refundEvent(amountRefunded: number, eventId = "evt_ref_goal") {
    return {
      id: eventId,
      type: "charge.refunded",
      livemode: false,
      data: {
        object: {
          id: "ch_test_123",
          object: "charge",
          payment_intent: "pi_test_123",
          amount_refunded: amountRefunded,
          refunds: {
            data: [
              {
                id: `re_${eventId}`,
                amount: amountRefunded,
                status: "succeeded",
                reason: null,
              },
            ],
          },
          metadata: { gift_id: GIFT_ID },
        },
      },
    } as unknown as Stripe.Event;
  }

  it("credits the goal with the gift amount exactly once", async () => {
    seedGoal();
    tables.gifts = [baseGift({ goal_id: GOAL_ID })];

    await processStripeEvent(sessionCompletedEvent());
    expect(tables.creator_goals[0].raised_amount).toBe(500);

    // Duplicate delivery: gift already paid, no second credit.
    await processStripeEvent(sessionCompletedEvent());
    expect(tables.creator_goals[0].raised_amount).toBe(500);
  });

  it("leaves goals untouched for gifts without attribution", async () => {
    seedGoal();
    await processStripeEvent(sessionCompletedEvent());
    expect(tables.gifts[0].status).toBe("paid");
    expect(tables.creator_goals[0].raised_amount).toBe(0);
  });

  it("does not credit the goal when verification flags a mismatch", async () => {
    seedGoal();
    tables.gifts = [baseGift({ goal_id: GOAL_ID })];
    retrievePaymentIntent.mockResolvedValue(paymentIntent({ amount: 999 }));

    await processStripeEvent(sessionCompletedEvent());
    expect(tables.creator_goals[0].raised_amount).toBe(0);
  });

  it("withdraws the whole credit on a full refund", async () => {
    seedGoal(500);
    tables.gifts = [
      baseGift({
        goal_id: GOAL_ID,
        status: "paid",
        stripe_payment_intent_id: "pi_test_123",
      }),
    ];

    await processStripeEvent(refundEvent(554));
    expect(tables.gifts[0].status).toBe("refunded");
    expect(tables.creator_goals[0].raised_amount).toBe(0);
  });

  it("withdraws proportionally on a partial refund, then the rest on completion", async () => {
    seedGoal(500);
    tables.gifts = [
      baseGift({
        goal_id: GOAL_ID,
        status: "paid",
        stripe_payment_intent_id: "pi_test_123",
      }),
    ];

    // £1.00 of the £5.54 charge refunded → floor(500 * 100 / 554) = 90.
    await processStripeEvent(refundEvent(100, "evt_ref_a"));
    expect(tables.gifts[0].status).toBe("partially_refunded");
    expect(tables.gifts[0].amount_refunded).toBe(100);
    expect(tables.creator_goals[0].raised_amount).toBe(410);

    // Second event completes the refund; credit nets out to exactly zero.
    await processStripeEvent(refundEvent(554, "evt_ref_b"));
    expect(tables.gifts[0].amount_refunded).toBe(554);
    expect(tables.creator_goals[0].raised_amount).toBe(0);
  });

  it("withdraws the remaining credit when a dispute is lost", async () => {
    seedGoal(410);
    tables.gifts = [
      baseGift({
        goal_id: GOAL_ID,
        status: "disputed",
        amount_refunded: 100,
        stripe_payment_intent_id: "pi_test_123",
      }),
    ];
    const event = {
      id: "evt_disp_goal",
      type: "charge.dispute.closed",
      livemode: false,
      data: {
        object: {
          id: "dp_goal",
          object: "dispute",
          amount: 454,
          reason: "fraudulent",
          status: "lost",
          charge: {
            id: "ch_test_123",
            payment_intent: "pi_test_123",
            metadata: { gift_id: GIFT_ID },
          },
        },
      },
    } as unknown as Stripe.Event;

    await processStripeEvent(event);
    expect(tables.gifts[0].status).toBe("dispute_lost");
    // 500 credited − 90 already withdrawn by the partial refund = 410 left.
    expect(tables.creator_goals[0].raised_amount).toBe(0);
  });
});

describe("Connect account events", () => {
  it("synchronises on account.updated", async () => {
    const account = { id: "acct_recipient", object: "account" };
    const event = {
      id: "evt_acct",
      type: "account.updated",
      livemode: false,
      account: "acct_recipient",
      data: { object: account },
    } as unknown as Stripe.Event;
    await processStripeEvent(event);
    expect(syncConnectedAccount).toHaveBeenCalledWith("acct_recipient", account);
  });

  it("synchronises on capability.updated using the event account context", async () => {
    const event = {
      id: "evt_cap",
      type: "capability.updated",
      livemode: false,
      account: "acct_recipient",
      data: { object: { id: "transfers", object: "capability" } },
    } as unknown as Stripe.Event;
    await processStripeEvent(event);
    expect(syncConnectedAccount).toHaveBeenCalledWith("acct_recipient");
  });
});

describe("unhandled events", () => {
  it("skips event types outside the subscription", async () => {
    const event = {
      id: "evt_x",
      type: "customer.created",
      livemode: false,
      data: { object: { id: "cus_1", object: "customer" } },
    } as unknown as Stripe.Event;
    const outcome = await processStripeEvent(event);
    expect(outcome.status).toBe("skipped");
  });
});
