import { NextResponse } from "next/server";

import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { validateWishlistItemInput } from "@/lib/wishlist/item-schema";
import { createItem } from "@/lib/wishlist/items";

/** Creates a wish-list item (always as a draft) for the signed-in creator. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Wish lists aren't available right now." },
      { status: 503 },
    );
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (isRateLimited(`wishlist:${user.id}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const payload = await request.json().catch(() => null);
  const validation = validateWishlistItemInput(payload);
  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const result = await createItem(user.id, validation.data);
  if (!result.ok) {
    if (result.reason === "currency_mismatch") {
      return NextResponse.json(
        { errors: { currency: "Wish-list items must use your payout currency." } },
        { status: 409 },
      );
    }
    if (result.reason === "price_unfundable") {
      return NextResponse.json(
        {
          errors: {
            priceAmount:
              "That price is outside the range a supporter can fund in one Tee.",
          },
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Saving isn't available right now. Please try again." },
      { status: 503 },
    );
  }
  return NextResponse.json({ item: result.item }, { status: 201 });
}
