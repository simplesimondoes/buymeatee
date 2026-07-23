import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/checkout/route";

const createGiftCheckout = vi.fn();
const getAuthenticatedUser = vi.fn();

vi.mock("@/lib/payments/gifts", () => ({
  createGiftCheckout: (...args: unknown[]) => createGiftCheckout(...args),
}));
vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: () => getAuthenticatedUser(),
}));

const validBody = {
  recipientUsername: "sam-golfer",
  giftAmount: 500,
  currency: "gbp",
  senderName: "Alex",
  isAnonymous: false,
};

let requestCount = 0;
function request(body: unknown): Request {
  requestCount += 1;
  return new Request("https://buymeatee.com/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Unique IP per test to keep the in-memory rate limiter out of the way.
      "x-forwarded-for": `203.0.113.${requestCount % 250}`,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getAuthenticatedUser.mockResolvedValue(null);
  createGiftCheckout.mockResolvedValue({
    ok: true,
    checkoutUrl: "https://checkout.stripe.com/c/pay/x",
    giftPublicId: "22222222-2222-4222-8222-222222222222",
  });
});

describe("POST /api/checkout", () => {
  it("creates a checkout for a valid guest gift", async () => {
    const response = await POST(request(validBody));
    expect(response.status).toBe(200);
    expect(createGiftCheckout).toHaveBeenCalledTimes(1);
    // Guest flow: no sender user id.
    expect(createGiftCheckout.mock.calls[0][1]).toBeNull();
  });

  it("attaches the signed-in donor", async () => {
    getAuthenticatedUser.mockResolvedValue({ id: "donor-1" });
    await POST(request(validBody));
    expect(createGiftCheckout.mock.calls[0][1]).toBe("donor-1");
  });

  it("ignores client-supplied totals and fees — only validated fields pass through", async () => {
    await POST(
      request({
        ...validBody,
        totalAmount: 1, // manipulation attempts
        applicationFeeAmount: 0,
        platformFeeAmount: 0,
        recipientStripeAccountId: "acct_attacker",
      }),
    );
    const forwarded = createGiftCheckout.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(forwarded).not.toHaveProperty("totalAmount");
    expect(forwarded).not.toHaveProperty("applicationFeeAmount");
    expect(forwarded).not.toHaveProperty("recipientStripeAccountId");
    expect(forwarded.giftAmount).toBe(500);
  });

  it("rejects invalid payloads before any service call", async () => {
    const response = await POST(request({ ...validBody, giftAmount: -5 }));
    expect(response.status).toBe(400);
    expect(createGiftCheckout).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const bad = new Request("https://buymeatee.com/api/checkout", {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.251" },
      body: "not json",
    });
    const response = await POST(bad);
    expect(response.status).toBe(400);
  });

  it("returns 409 for recipients who can't receive gifts", async () => {
    createGiftCheckout.mockResolvedValue({
      ok: false,
      error: { kind: "recipient-not-ready" },
    });
    const response = await POST(request(validBody));
    expect(response.status).toBe(409);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("This golfer isn't accepting Tees yet.");
  });

  it("returns 400 for currency mismatches", async () => {
    createGiftCheckout.mockResolvedValue({
      ok: false,
      error: { kind: "currency-mismatch" },
    });
    const response = await POST(request(validBody));
    expect(response.status).toBe(400);
  });

  it("returns 400 for out-of-bounds amounts", async () => {
    createGiftCheckout.mockResolvedValue({
      ok: false,
      error: { kind: "amount", error: "below-minimum" },
    });
    const response = await POST(request(validBody));
    expect(response.status).toBe(400);
  });

  it("rate limits repeated attempts from one client", async () => {
    const fixedIp = () =>
      new Request("https://buymeatee.com/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "198.51.100.77",
        },
        body: JSON.stringify(validBody),
      });
    let limited = false;
    for (let i = 0; i < 12; i += 1) {
      const response = await POST(fixedIp());
      if (response.status === 429) {
        limited = true;
        break;
      }
    }
    expect(limited).toBe(true);
  });
});
