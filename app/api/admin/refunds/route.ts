import { NextResponse } from "next/server";

import { adminRefundGift, isAdmin } from "@/lib/payments/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Admin-only full refund. Authorisation is enforced here, server-side —
 * never by hiding buttons. The status becomes authoritative only when the
 * charge.refunded webhook lands.
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  let payload: { giftPublicId?: unknown; reason?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const giftPublicId =
    typeof payload.giftPublicId === "string" ? payload.giftPublicId.trim() : "";
  const reason =
    typeof payload.reason === "string" ? payload.reason.trim().slice(0, 500) : "";
  if (!/^[0-9a-f-]{36}$/i.test(giftPublicId) || reason.length === 0) {
    return NextResponse.json(
      { error: "A gift reference and a reason are required." },
      { status: 400 },
    );
  }

  const result = await adminRefundGift(giftPublicId, user.id, reason);
  if (result.ok) {
    return NextResponse.json({ refundId: result.refundId });
  }
  switch (result.error) {
    case "not-found":
      return NextResponse.json({ error: "Gift not found." }, { status: 404 });
    case "not-refundable":
      return NextResponse.json(
        { error: "This gift can't be refunded (not paid, or already refunded)." },
        { status: 409 },
      );
    default:
      return NextResponse.json(
        { error: "Refund failed. Check the logs and Stripe dashboard." },
        { status: 502 },
      );
  }
}
