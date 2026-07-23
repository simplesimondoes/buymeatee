import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/admin/refunds/route";

const getAuthenticatedUser = vi.fn();
const isAdmin = vi.fn();
const adminRefundGift = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUser: () => getAuthenticatedUser(),
}));
vi.mock("@/lib/payments/admin", () => ({
  isAdmin: (...args: unknown[]) => isAdmin(...args),
  adminRefundGift: (...args: unknown[]) => adminRefundGift(...args),
}));

const GIFT_PUBLIC_ID = "22222222-2222-4222-8222-222222222222";

function request(body: unknown): Request {
  return new Request("https://buymeatee.com/api/admin/refunds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/refunds", () => {
  it("rejects anonymous callers", async () => {
    getAuthenticatedUser.mockResolvedValue(null);
    const response = await POST(
      request({ giftPublicId: GIFT_PUBLIC_ID, reason: "test" }),
    );
    expect(response.status).toBe(403);
    expect(adminRefundGift).not.toHaveBeenCalled();
  });

  it("rejects signed-in non-admins — authorisation is server-side", async () => {
    getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    isAdmin.mockResolvedValue(false);
    const response = await POST(
      request({ giftPublicId: GIFT_PUBLIC_ID, reason: "test" }),
    );
    expect(response.status).toBe(403);
    expect(adminRefundGift).not.toHaveBeenCalled();
  });

  it("requires a reason for the audit trail", async () => {
    getAuthenticatedUser.mockResolvedValue({ id: "admin-1" });
    isAdmin.mockResolvedValue(true);
    const response = await POST(
      request({ giftPublicId: GIFT_PUBLIC_ID, reason: "" }),
    );
    expect(response.status).toBe(400);
  });

  it("lets an admin refund with an audited reason", async () => {
    getAuthenticatedUser.mockResolvedValue({ id: "admin-1" });
    isAdmin.mockResolvedValue(true);
    adminRefundGift.mockResolvedValue({ ok: true, refundId: "re_1" });
    const response = await POST(
      request({ giftPublicId: GIFT_PUBLIC_ID, reason: "Donor request" }),
    );
    expect(response.status).toBe(200);
    expect(adminRefundGift).toHaveBeenCalledWith(
      GIFT_PUBLIC_ID,
      "admin-1",
      "Donor request",
    );
  });

  it("surfaces non-refundable gifts as a conflict", async () => {
    getAuthenticatedUser.mockResolvedValue({ id: "admin-1" });
    isAdmin.mockResolvedValue(true);
    adminRefundGift.mockResolvedValue({ ok: false, error: "not-refundable" });
    const response = await POST(
      request({ giftPublicId: GIFT_PUBLIC_ID, reason: "Donor request" }),
    );
    expect(response.status).toBe(409);
  });
});
