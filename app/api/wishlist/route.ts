import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { errorDetail } from "@/lib/i18n/errors";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { validateWishlistItemInput } from "@/lib/wishlist/item-schema";
import { createItem } from "@/lib/wishlist/items";

/** Creates a wish-list item (always as a draft) for the signed-in creator. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError("api.wishlistUnavailable", { status: 503 });
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  if (isRateLimited(`wishlist:${user.id}`, 30, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const payload = await request.json().catch(() => null);
  const validation = validateWishlistItemInput(payload);
  if (!validation.ok) {
    return apiError("api.checkFields", {
      status: 400,
      fields: validation.errors,
    });
  }

  const result = await createItem(user.id, validation.data);
  if (!result.ok) {
    if (result.reason === "currency_mismatch") {
      return apiError("api.itemPayoutCurrency", {
        status: 409,
        fields: { currency: errorDetail("api.itemPayoutCurrency") },
      });
    }
    if (result.reason === "price_unfundable") {
      return apiError("api.itemPriceRange", {
        status: 409,
        fields: { priceAmount: errorDetail("api.itemPriceRange") },
      });
    }
    return apiError("api.savingUnavailable", { status: 503 });
  }
  return NextResponse.json({ item: result.item }, { status: 201 });
}
