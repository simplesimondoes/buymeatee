import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthenticatedUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { validateWishlistItemInput } from "@/lib/wishlist/item-schema";
import {
  deleteItem,
  moveItem,
  transitionItem,
  updateItem,
  type WishlistMutationFailure,
} from "@/lib/wishlist/items";
import { isWishlistItemStatus } from "@/lib/wishlist/types";

/**
 * Mutations on one of the signed-in creator's wish-list items:
 *   POST { action: "edit", ...item fields }
 *   POST { action: "transition", to: <status> }  // never "funded" — that is
 *                                                    set only by the webhook path
 *   POST { action: "move", direction: "up" | "down" }
 *   DELETE — drafts and unfunded items only; funded items are archived.
 * Ownership is enforced by RLS plus the creator_id filter in lib/wishlist.
 */

const failureResponses: Record<
  Exclude<WishlistMutationFailure, "has_support">,
  { code: string; status: number }
> = {
  not_found: { code: "api.itemGone", status: 404 },
  invalid_transition: { code: "api.itemStateChange", status: 409 },
  currency_locked: { code: "api.itemPriceLocked", status: 409 },
  currency_mismatch: { code: "api.itemPayoutCurrency", status: 409 },
  price_unfundable: { code: "api.itemPriceRange", status: 409 },
  unavailable: { code: "api.savingUnavailable", status: 503 },
};

function failure(reason: WishlistMutationFailure) {
  if (reason === "has_support") {
    // No stable code exists for the funded-item delete refusal yet; the
    // client hook passes raw strings through, so this stays honest until
    // one is added.
    return NextResponse.json(
      { error: { code: "api.itemFundedLocked" } },
      { status: 409 },
    );
  }
  const { code, status } = failureResponses[reason];
  return apiError(code, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return failure("unavailable");
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }
  if (isRateLimited(`wishlist:${user.id}`, 30, 60_000)) {
    return apiError("api.tooManyRequests", { status: 429 });
  }

  const { itemId } = await params;
  const payload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (payload?.action === "edit") {
    const validation = validateWishlistItemInput(payload);
    if (!validation.ok) {
      return apiError("api.checkFields", {
        status: 400,
        fields: validation.errors,
      });
    }
    const result = await updateItem(user.id, itemId, validation.data);
    return result.ok
      ? NextResponse.json({ item: result.item })
      : failure(result.reason);
  }

  if (payload?.action === "transition") {
    if (!isWishlistItemStatus(payload.to)) {
      return apiError("api.itemStatusUnknown", { status: 400 });
    }
    // 'funded' is set only by verified payment — refuse it as a client target.
    if (payload.to === "funded") {
      return apiError("api.itemFundedBySupporters", { status: 409 });
    }
    const result = await transitionItem(user.id, itemId, payload.to);
    return result.ok
      ? NextResponse.json({ item: result.item })
      : failure(result.reason);
  }

  if (payload?.action === "move") {
    if (payload.direction !== "up" && payload.direction !== "down") {
      return apiError("api.unknownDirection", { status: 400 });
    }
    const result = await moveItem(user.id, itemId, payload.direction);
    return result.ok
      ? NextResponse.json({ moved: true })
      : failure("unavailable");
  }

  return apiError("api.unknownAction", { status: 400 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return failure("unavailable");
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("api.signInRequired", { status: 401 });
  }

  const { itemId } = await params;
  const result = await deleteItem(user.id, itemId);
  return result.ok ? NextResponse.json({ deleted: true }) : failure(result.reason);
}
