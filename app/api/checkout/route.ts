import { NextResponse } from "next/server";

import { defaultLocale, isAppLocale } from "@/i18n/locales";
import { apiError } from "@/lib/api/errors";
import type { ErrorDetail } from "@/lib/i18n/errors";
import { validateGiftInput } from "@/lib/payments/gift-schema";
import { createGiftCheckout } from "@/lib/payments/gifts";
import { clientKeyFromHeaders, isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Creates a gift and its Stripe Checkout Session. Guest donors are supported
 * by design; signed-in donors get the gift attached to their account. Every
 * amount is recalculated server-side — the browser only ever sends the gift
 * amount, never fees or totals.
 *
 * Errors carry stable codes (ADR-019) rendered into the supporter's language
 * by the client — never English sentences from here.
 */
export async function POST(request: Request) {
  const clientKey = clientKeyFromHeaders(request.headers);
  if (isRateLimited(`checkout:${clientKey}`, 10, 60_000)) {
    return apiError("api.tooManyAttempts", { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("api.invalidRequest", { status: 400 });
  }

  const validation = validateGiftInput(payload);
  if (!validation.ok) {
    return apiError("api.checkFields", {
      status: 400,
      fields: validation.errors as Record<string, ErrorDetail>,
    });
  }

  // The supporter's UI language: validated against the allowlist, never
  // trusted raw. Drives Stripe Checkout's language, the return URLs and the
  // receipt email; unknown/missing values fall back to English.
  const requestedLocale = (payload as { locale?: unknown }).locale;
  const locale = isAppLocale(requestedLocale) ? requestedLocale : defaultLocale;

  const user = await getAuthenticatedUser().catch(() => null);
  const result = await createGiftCheckout(
    validation.data,
    user?.id ?? null,
    locale,
  );

  if (result.ok) {
    return NextResponse.json({
      url: result.checkoutUrl,
      giftPublicId: result.giftPublicId,
    });
  }

  switch (result.error.kind) {
    case "recipient-not-found":
      return apiError("api.recipientNotFound", { status: 404 });
    case "recipient-not-ready":
      return apiError("api.recipientNotReady", { status: 409 });
    case "currency-mismatch":
      return apiError("api.currencyMismatch", { status: 400 });
    case "goal-not-available":
      return apiError("api.goalNotAvailable", { status: 409 });
    case "wishlist-item-not-available":
      return apiError("api.wishlistItemNotAvailable", { status: 409 });
    case "wishlist-amount-mismatch":
      return apiError("api.wishlistAmountMismatch", { status: 409 });
    case "amount":
      return apiError(
        result.error.error === "below-minimum"
          ? "api.amountBelowMinimum"
          : result.error.error === "above-maximum"
            ? "api.amountAboveMaximum"
            : "api.amountInvalid",
        { status: 400 },
      );
    case "unavailable":
      return apiError("api.paymentsUnavailable", { status: 503 });
  }
}
