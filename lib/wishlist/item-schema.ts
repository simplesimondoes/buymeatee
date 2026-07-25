import {
  isSupportedCurrency,
  isValidMinorAmount,
  type SupportedCurrency,
} from "@/lib/payments/currency";
import {
  WISHLIST_DESCRIPTION_MAX_LENGTH,
  WISHLIST_PRICE_MAX_MINOR,
  WISHLIST_TITLE_MAX_LENGTH,
} from "@/lib/wishlist/types";

/**
 * Wish-list item form validation. Pure module shared by the client (inline
 * errors) and the server (authoritative — mutations revalidate everything and
 * additionally check the price is fundable in a single gift). Status changes
 * are validated separately via canTransitionWishlistItem().
 */

export interface WishlistItemInput {
  title: string;
  description?: string;
  currency: SupportedCurrency;
  /** Integer minor units — the price one supporter pays to fund the item. */
  priceAmount: number;
}

export type WishlistFieldName =
  | "title"
  | "description"
  | "currency"
  | "priceAmount";

export type WishlistValidationResult =
  | { ok: true; data: WishlistItemInput }
  | { ok: false; errors: Partial<Record<WishlistFieldName, string>> };

export function validateWishlistItemInput(
  payload: unknown,
): WishlistValidationResult {
  const errors: Partial<Record<WishlistFieldName, string>> = {};
  const input =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (title.length < 1 || title.length > WISHLIST_TITLE_MAX_LENGTH) {
    errors.title = `Give the item a name (up to ${WISHLIST_TITLE_MAX_LENGTH} characters).`;
  }

  let description: string | undefined;
  if (
    typeof input.description === "string" &&
    input.description.trim() !== ""
  ) {
    description = input.description.trim();
    if (description.length > WISHLIST_DESCRIPTION_MAX_LENGTH) {
      errors.description = `Keep the description under ${WISHLIST_DESCRIPTION_MAX_LENGTH} characters.`;
    }
  }

  if (!isSupportedCurrency(input.currency)) {
    errors.currency = "That currency isn't supported.";
  }

  const priceAmount = input.priceAmount;
  if (
    !isValidMinorAmount(priceAmount) ||
    priceAmount <= 0 ||
    priceAmount > WISHLIST_PRICE_MAX_MINOR
  ) {
    errors.priceAmount = "Enter a valid price.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      title,
      description,
      currency: input.currency as SupportedCurrency,
      priceAmount: priceAmount as number,
    },
  };
}
