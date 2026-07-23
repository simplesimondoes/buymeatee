import { NextResponse } from "next/server";

import {
  createOnboardingLink,
  getConnectedAccountForUser,
} from "@/lib/payments/connect";
import { logPaymentEvent } from "@/lib/payments/log";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Stripe Account Links are single-use and expire; Stripe sends the user here
 * when a link is no longer valid. Mint a fresh link for the signed-in owner
 * and continue onboarding, or fall back to the payments settings page.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.redirect(
      new URL("/sign-in?next=%2Fsettings%2Fpayments", origin),
    );
  }

  try {
    const account = await getConnectedAccountForUser(user.id);
    if (!account) {
      return NextResponse.redirect(new URL("/settings/payments", origin));
    }
    const url = await createOnboardingLink(account);
    return NextResponse.redirect(url);
  } catch (error) {
    logPaymentEvent("error", "connect.refresh_failed", {
      user_id: user.id,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.redirect(new URL("/settings/payments", origin));
  }
}
