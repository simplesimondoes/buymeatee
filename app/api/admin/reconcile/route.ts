import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/payments/admin";
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
      return NextResponse.json({ error: "Not authorised." }, { status: 403 });
    }
  }

  try {
    const report = await reconcileStuckGifts();
    const goals = await reconcileGoalProgress();
    return NextResponse.json({ ...report, goals });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reconciliation failed." },
      { status: 500 },
    );
  }
}
