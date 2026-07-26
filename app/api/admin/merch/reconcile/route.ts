import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { canViewAnalytics } from "@/lib/admin/analytics-access";
import { logPaymentEvent } from "@/lib/payments/log";
import { reconcileMerch } from "@/lib/merch/reconciliation";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Runs the merch reconciliation sweep (ADR-024, spec §36). Callable by the
 * owner, or by a scheduler (Vercel Cron) presenting the RECONCILIATION_SECRET
 * bearer token. Idempotent — safe to run on a schedule.
 */
export async function POST(request: Request) {
  const secret = process.env.RECONCILIATION_SECRET;
  const bearer = request.headers.get("authorization");
  const viaSecret = Boolean(secret) && bearer === `Bearer ${secret}`;

  if (!viaSecret) {
    const user = await getAuthenticatedUser();
    if (!user || !canViewAnalytics(user.email)) {
      return apiError("api.notAuthorised", { status: 403 });
    }
  }

  try {
    const report = await reconcileMerch();
    return NextResponse.json(report);
  } catch (error) {
    logPaymentEvent("error", "admin.merch_reconcile_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return apiError("api.unavailable", { status: 500 });
  }
}
