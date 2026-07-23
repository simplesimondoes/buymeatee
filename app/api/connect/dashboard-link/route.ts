import { NextResponse } from "next/server";

import {
  createDashboardLoginLink,
  getConnectedAccountForUser,
} from "@/lib/payments/connect";
import { logPaymentEvent } from "@/lib/payments/log";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Creates a Stripe-hosted dashboard login link — only ever for the
 * authenticated owner of the connected account.
 */
export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (isRateLimited(`dashlink:${user.id}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  try {
    const account = await getConnectedAccountForUser(user.id);
    if (!account || !account.details_submitted) {
      return NextResponse.json(
        { error: "Payment setup isn't complete yet." },
        { status: 409 },
      );
    }
    const url = await createDashboardLoginLink(account);
    return NextResponse.json({ url });
  } catch (error) {
    logPaymentEvent("error", "connect.dashboard_link_failed", {
      user_id: user.id,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "The payout dashboard isn't available right now." },
      { status: 503 },
    );
  }
}
