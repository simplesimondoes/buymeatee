import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { isAdmin } from "@/lib/payments/admin";
import { logPaymentEvent } from "@/lib/payments/log";
import {
  reconcileGoalProgress,
  reconcileStuckGifts,
} from "@/lib/payments/reconciliation";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Runs reconciliation over stuck gifts. Callable by a signed-in admin, or by
 * a scheduler (e.g. Vercel Cron) presenting the RECONCILIATION_SECRET bearer
 * token. Constant secret comparison isn't needed here beyond equality — the
 * token is long and random by requirement.
 */
export async function POST(request: Request) {
  const secret = process.env.RECONCILIATION_SECRET;
  const bearer = request.headers.get("authorization");
  const viaSecret = Boolean(secret) && bearer === `Bearer ${secret}`;

  if (!viaSecret) {
    const user = await getAuthenticatedUser();
    if (!user || !(await isAdmin(user.id))) {
      return apiError("api.notAuthorised", { status: 403 });
    }
  }

  try {
    const report = await reconcileStuckGifts();
    const goals = await reconcileGoalProgress();
    return NextResponse.json({ ...report, goals });
  } catch (error) {
    // Raw provider/DB errors stay in the logs (ADR-019), never in responses.
    logPaymentEvent("error", "admin.reconcile_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return apiError("api.unavailable", { status: 500 });
  }
}
