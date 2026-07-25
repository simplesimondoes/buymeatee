import { NextResponse } from "next/server";

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
  WishlistMutationFailure,
  { error: string; status: number }
> = {
  not_found: { error: "That item no longer exists.", status: 404 },
  invalid_transition: {
    error: "That change isn't possible from the item's current state.",
    status: 409,
  },
  currency_locked: {
    error: "A funded item keeps its price and currency.",
    status: 409,
  },
  currency_mismatch: {
    error: "Wish-list items must use your payout currency.",
    status: 409,
  },
  price_unfundable: {
    error: "That price is outside the range a supporter can fund in one Tee.",
    status: 409,
  },
  has_support: {
    error:
      "This item has been funded, so it can't be deleted — archive it instead.",
    status: 409,
  },
  unavailable: {
    error: "Saving isn't available right now. Please try again.",
    status: 503,
  },
};

function failure(reason: WishlistMutationFailure) {
  const { error, status } = failureResponses[reason];
  return NextResponse.json({ error }, { status });
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
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (isRateLimited(`wishlist:${user.id}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const { itemId } = await params;
  const payload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (payload?.action === "edit") {
    const validation = validateWishlistItemInput(payload);
    if (!validation.ok) {
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }
    const result = await updateItem(user.id, itemId, validation.data);
    return result.ok
      ? NextResponse.json({ item: result.item })
      : failure(result.reason);
  }

  if (payload?.action === "transition") {
    if (!isWishlistItemStatus(payload.to)) {
      return NextResponse.json({ error: "Unknown item status." }, { status: 400 });
    }
    // 'funded' is set only by verified payment — refuse it as a client target.
    if (payload.to === "funded") {
      return NextResponse.json(
        { error: "Items become funded through a supporter's payment." },
        { status: 409 },
      );
    }
    const result = await transitionItem(user.id, itemId, payload.to);
    return result.ok
      ? NextResponse.json({ item: result.item })
      : failure(result.reason);
  }

  if (payload?.action === "move") {
    if (payload.direction !== "up" && payload.direction !== "down") {
      return NextResponse.json({ error: "Unknown direction." }, { status: 400 });
    }
    const result = await moveItem(user.id, itemId, payload.direction);
    return result.ok
      ? NextResponse.json({ moved: true })
      : failure("unavailable");
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
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
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { itemId } = await params;
  const result = await deleteItem(user.id, itemId);
  return result.ok ? NextResponse.json({ deleted: true }) : failure(result.reason);
}
