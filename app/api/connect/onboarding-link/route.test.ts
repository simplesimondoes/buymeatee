import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/connect/onboarding-link/route";

const getAuthenticatedUser = vi.fn();
const getOrCreateConnectedAccount = vi.fn();
const createOnboardingLink = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: () => getAuthenticatedUser(),
}));
vi.mock("@/lib/payments/connect", () => ({
  getOrCreateConnectedAccount: (...args: unknown[]) =>
    getOrCreateConnectedAccount(...args),
  createOnboardingLink: (...args: unknown[]) => createOnboardingLink(...args),
}));
vi.mock("@/lib/payments/log", () => ({ logPaymentEvent: vi.fn() }));

function request(body: unknown = {}): Request {
  return new Request("https://buymeatee.com/api/connect/onboarding-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/connect/onboarding-link", () => {
  it("requires authentication", async () => {
    getAuthenticatedUser.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(getOrCreateConnectedAccount).not.toHaveBeenCalled();
  });

  it("only ever onboards the authenticated user — no target user is accepted", async () => {
    getAuthenticatedUser.mockResolvedValue({
      id: "user-1",
      email: "me@example.com",
    });
    getOrCreateConnectedAccount.mockResolvedValue({ id: "row-1" });
    createOnboardingLink.mockResolvedValue("https://connect.stripe.com/setup/x");

    // A malicious body naming someone else is ignored by design.
    const response = await POST(
      request({ userId: "victim-2", country: "GB" }),
    );
    expect(response.status).toBe(200);
    expect(getOrCreateConnectedAccount).toHaveBeenCalledWith(
      "user-1",
      "me@example.com",
      "GB",
    );
    expect(await response.json()).toEqual({
      url: "https://connect.stripe.com/setup/x",
    });
  });

  it("rejects unsupported countries", async () => {
    getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    const response = await POST(request({ country: "US" }));
    expect(response.status).toBe(400);
    expect(getOrCreateConnectedAccount).not.toHaveBeenCalled();
  });

  it("fails safely when Stripe is unavailable", async () => {
    getAuthenticatedUser.mockResolvedValue({ id: "user-2" });
    getOrCreateConnectedAccount.mockRejectedValue(new Error("no key"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: string };
    expect(body.error).not.toContain("no key"); // internals stay internal
  });
});
