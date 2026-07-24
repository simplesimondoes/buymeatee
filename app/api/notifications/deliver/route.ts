import { NextResponse } from "next/server";

import { deliverPendingNotifications } from "@/lib/email/deliver";
import { isAdmin } from "@/lib/payments/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Drains the pending notification queue and sends each email via Resend.
 * Callable by a signed-in admin, or by a scheduler (e.g. Vercel Cron)
 * presenting the NOTIFICATIONS_DELIVERY_SECRET bearer token. Mirrors the
 * reconcile route's auth. Delivery is idempotent — re-runs only pick up rows
 * still marked "pending".
 */
export async function POST(request: Request) {
  const secret = process.env.NOTIFICATIONS_DELIVERY_SECRET;
  const bearer = request.headers.get("authorization");
  const viaSecret = Boolean(secret) && bearer === `Bearer ${secret}`;

  if (!viaSecret) {
    const user = await getAuthenticatedUser();
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: "Not authorised." }, { status: 403 });
    }
  }

  try {
    const summary = await deliverPendingNotifications();
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delivery failed." },
      { status: 500 },
    );
  }
}
