import { NextResponse } from "next/server";

import { canViewAnalytics } from "@/lib/admin/analytics-access";
import { apiError } from "@/lib/api/errors";
import {
  moderateProduct,
  type ModerationDecision,
} from "@/lib/merch/moderation";
import type { MerchModerationReason } from "@/lib/merch/types";
import { clientKeyFromHeaders, isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Owner-only merch moderation decision (ADR-024, spec §24). Approve, request
 * changes, or reject a product awaiting review. request_changes/reject require
 * a reason. Non-owners get a plain 404.
 */
const DECISIONS: ModerationDecision[] = ["approve", "request_changes", "reject"];

export async function POST(request: Request) {
  if (isRateLimited(`merch-moderate:${clientKeyFromHeaders(request.headers)}`, 60, 60_000)) {
    return apiError("api.tooManyAttempts", { status: 429 });
  }
  const user = await getAuthenticatedUser().catch(() => null);
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  if (!canViewAnalytics(user.email)) {
    return apiError("api.notFound", { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("api.invalidRequest", { status: 400 });
  }
  const p = body as Record<string, unknown>;
  if (
    typeof p.productId !== "string" ||
    typeof p.decision !== "string" ||
    !DECISIONS.includes(p.decision as ModerationDecision)
  ) {
    return apiError("api.invalidRequest", { status: 400 });
  }

  const result = await moderateProduct(
    user.id,
    p.productId,
    p.decision as ModerationDecision,
    typeof p.reason === "string" ? (p.reason as MerchModerationReason) : undefined,
    typeof p.notes === "string" ? p.notes : undefined,
  );
  if (result.ok) {
    return NextResponse.json({ ok: true });
  }
  switch (result.error) {
    case "not_found":
      return apiError("api.notFound", { status: 404 });
    case "reason_required":
      return apiError("api.checkFields", { status: 400 });
    default:
      return apiError("api.unavailable", { status: 503 });
  }
}
