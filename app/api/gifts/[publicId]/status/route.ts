import { NextResponse } from "next/server";

import { getGiftPublicStatus } from "@/lib/payments/gifts";

/**
 * Safe polling endpoint for the checkout success page. Looks a gift up by its
 * non-guessable public id and returns only donor-facing display fields — it
 * never marks anything paid (that is the webhook's job) and never exposes
 * Stripe objects.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await params;
  try {
    const status = await getGiftPublicStatus(publicId);
    if (!status) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json(status, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Unavailable." }, { status: 503 });
  }
}
