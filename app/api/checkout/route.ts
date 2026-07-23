import { NextResponse } from "next/server";

import { validateGiftInput } from "@/lib/payments/gift-schema";
import { createGiftCheckout } from "@/lib/payments/gifts";
import { clientKeyFromHeaders, isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Creates a gift and its Stripe Checkout Session. Guest donors are supported
 * by design; signed-in donors get the gift attached to their account. Every
 * amount is recalculated server-side — the browser only ever sends the gift
 * amount, never fees or totals.
 */
export async function POST(request: Request) {
  const clientKey = clientKeyFromHeaders(request.headers);
  if (isRateLimited(`checkout:${clientKey}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const validation = validateGiftInput(payload);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", errors: validation.errors },
      { status: 400 },
    );
  }

  const user = await getAuthenticatedUser().catch(() => null);
  const result = await createGiftCheckout(validation.data, user?.id ?? null);

  if (result.ok) {
    return NextResponse.json({
      url: result.checkoutUrl,
      giftPublicId: result.giftPublicId,
    });
  }

  switch (result.error.kind) {
    case "recipient-not-found":
      return NextResponse.json(
        { error: "We couldn't find that golfer." },
        { status: 404 },
      );
    case "recipient-not-ready":
      return NextResponse.json(
        { error: "This golfer isn't accepting Tees yet." },
        { status: 409 },
      );
    case "currency-mismatch":
      return NextResponse.json(
        { error: "This golfer can't receive Tees in that currency." },
        { status: 400 },
      );
    case "goal-not-available":
      return NextResponse.json(
        {
          error:
            "That goal isn't open for support right now. Send general support instead, or refresh the page.",
        },
        { status: 409 },
      );
    case "amount":
      return NextResponse.json(
        {
          error:
            result.error.error === "below-minimum"
              ? "That amount is below the minimum for a Tee."
              : result.error.error === "above-maximum"
                ? "That amount is above the maximum for a Tee."
                : "Enter a valid amount.",
        },
        { status: 400 },
      );
    case "unavailable":
      return NextResponse.json(
        { error: "Payments aren't available right now. Please try again shortly." },
        { status: 503 },
      );
  }
}
