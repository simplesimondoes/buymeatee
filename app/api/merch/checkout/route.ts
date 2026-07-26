import { NextResponse } from "next/server";

import { defaultLocale, isAppLocale } from "@/i18n/locales";
import { apiError } from "@/lib/api/errors";
import { createMerchCheckout } from "@/lib/merch/checkout";
import { clientKeyFromHeaders, isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Create a Stripe-hosted Checkout Session for a merch purchase (ADR-024). Guest
 * buyers are supported. Everything is recomputed server-side (Printful cost +
 * shipping + total); the browser never sends money amounts. Live checkout is
 * refused unless MERCH_CHECKOUT_ENABLED + MERCH_COMPLIANCE_APPROVED are set.
 */
export async function POST(request: Request) {
  if (isRateLimited(`merch-checkout:${clientKeyFromHeaders(request.headers)}`, 12, 60_000)) {
    return apiError("api.tooManyAttempts", { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("api.invalidRequest", { status: 400 });
  }
  const p = body as Record<string, unknown>;
  const r = (p.recipient ?? {}) as Record<string, unknown>;

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const required = [
    p.creatorId,
    p.productId,
    p.colour,
    p.size,
    p.currency,
    r.name,
    r.address1,
    r.city,
    r.countryCode,
    r.zip,
  ];
  if (
    required.some((v) => typeof v !== "string" || v.trim() === "") ||
    typeof p.quantity !== "number" ||
    !Number.isInteger(p.quantity) ||
    p.quantity < 1 ||
    p.quantity > 10 ||
    !/^[A-Za-z]{2}$/.test(str(r.countryCode))
  ) {
    return apiError("api.invalidRequest", { status: 400 });
  }

  const requestedLocale = p.locale;
  const locale = isAppLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const user = await getAuthenticatedUser().catch(() => null);

  const result = await createMerchCheckout({
    creatorId: str(p.creatorId),
    productId: str(p.productId),
    colour: str(p.colour),
    size: str(p.size),
    quantity: p.quantity,
    currency: str(p.currency),
    buyerUserId: user?.id ?? null,
    buyerEmail: str(p.buyerEmail) || str(r.email) || null,
    locale,
    cancelPath: typeof p.cancelPath === "string" ? p.cancelPath : undefined,
    recipient: {
      name: str(r.name),
      address1: str(r.address1),
      address2: str(r.address2) || undefined,
      city: str(r.city),
      stateCode: str(r.stateCode) || undefined,
      countryCode: str(r.countryCode).toUpperCase(),
      zip: str(r.zip),
      email: str(r.email) || undefined,
      phone: str(r.phone) || undefined,
    },
  });

  if (result.ok) {
    return NextResponse.json({ url: result.checkoutUrl, reference: result.publicReference });
  }
  switch (result.error) {
    case "checkout-unavailable":
      return apiError("api.unavailable", { status: 503 });
    case "product-unavailable":
    case "variant-not-available":
      return apiError("api.notFound", { status: 404 });
    case "creator-not-payable":
    case "currency-mismatch":
    case "fulfilment-unavailable":
    case "shipping-unavailable":
    case "pricing-invalid":
      return apiError("api.unavailable", { status: 409 });
    default:
      return apiError("api.unavailable", { status: 503 });
  }
}
