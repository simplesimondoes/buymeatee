import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { getAllowedConnectCountries } from "@/lib/payments/config";
import {
  createOnboardingLink,
  getOrCreateConnectedAccount,
} from "@/lib/payments/connect";
import { logPaymentEvent } from "@/lib/payments/log";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Starts (or resumes) Stripe Connect onboarding for the signed-in user.
 * Creates the connected account server-side when needed and returns only the
 * single-use onboarding URL. The connected account always belongs to the
 * authenticated user — account ids are never accepted from the browser.
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }

  if (isRateLimited(`onboard:${user.id}`, 10, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  let country = "GB";
  try {
    const body = (await request.json().catch(() => ({}))) as {
      country?: unknown;
    };
    if (typeof body.country === "string") {
      const candidate = body.country.toUpperCase();
      if (!getAllowedConnectCountries().includes(candidate)) {
        return apiError("api.connectCountryUnsupported", { status: 400 });
      }
      country = candidate;
    }

    const account = await getOrCreateConnectedAccount(
      user.id,
      user.email,
      country,
    );
    const url = await createOnboardingLink(account);
    return NextResponse.json({ url });
  } catch (error) {
    logPaymentEvent("error", "connect.onboarding_link_failed", {
      user_id: user.id,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return apiError("api.connectUnavailable", { status: 503 });
  }
}
