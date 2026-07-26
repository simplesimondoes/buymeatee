import { NextResponse } from "next/server";

import { canViewAnalytics } from "@/lib/admin/analytics-access";
import { apiError } from "@/lib/api/errors";
import { submitPaidOrderToPrintful } from "@/lib/merch/fulfilment";
import { refundMerchOrder } from "@/lib/merch/refunds";
import { executeCreatorTransfer } from "@/lib/merch/transfers";
import type { MerchRefundReason } from "@/lib/merch/types";
import { clientKeyFromHeaders, isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Owner-only merch order ops actions (ADR-024, spec §25/§26): retry a Printful
 * submission, retry a creator transfer, or refund the order. Audited via the
 * order event timeline in each service. Non-owners get a plain 404.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  if (isRateLimited(`merch-order-ops:${clientKeyFromHeaders(request.headers)}`, 30, 60_000)) {
    return apiError("api.tooManyAttempts", { status: 429 });
  }
  const user = await getAuthenticatedUser().catch(() => null);
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  if (!canViewAnalytics(user.email)) {
    return apiError("api.notFound", { status: 404 });
  }

  const { orderId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("api.invalidRequest", { status: 400 });
  }
  const action = (body as { action?: unknown }).action;

  if (action === "retry-fulfilment") {
    const out = await submitPaidOrderToPrintful(orderId, { force: true });
    return NextResponse.json({ result: out });
  }
  if (action === "retry-transfer") {
    const out = await executeCreatorTransfer(orderId, { force: true });
    return NextResponse.json({ result: out });
  }
  if (action === "refund") {
    const reason = (body as { reason?: unknown }).reason;
    const out = await refundMerchOrder(
      user.id,
      orderId,
      (typeof reason === "string" ? reason : "admin_goodwill") as MerchRefundReason,
    );
    if (out.status === "failed") {
      return NextResponse.json({ result: out }, { status: 502 });
    }
    return NextResponse.json({ result: out });
  }
  return apiError("api.invalidRequest", { status: 400 });
}
