import type { SupportedCurrency } from "@/lib/payments/currency";

/**
 * Wish-list item domain types mirroring
 * supabase/migrations/*_wishlist_items.sql (ADR-018). Amounts are integer minor
 * units throughout. The 'funded' state is maintained only by verified webhook
 * processing — treat funded_by_gift_id / funded_at as read-only everywhere
 * outside lib/payments/webhooks.ts.
 */

export const WISHLIST_ITEM_STATUSES = [
  "draft",
  "active",
  "funded",
  "archived",
] as const;

export type WishlistItemStatus = (typeof WISHLIST_ITEM_STATUSES)[number];

export const WISHLIST_TITLE_MAX_LENGTH = 120;
export const WISHLIST_DESCRIPTION_MAX_LENGTH = 1000;
/**
 * A generous hard cap for a single tangible item (£50,000). The real, tighter
 * limit is the single-gift maximum: a wish is funded by ONE charge, so its
 * price must fall within the payment fee config's min/max — enforced in
 * lib/wishlist/items.ts, never invented here.
 */
export const WISHLIST_PRICE_MAX_MINOR = 5_000_000;

export interface WishlistItemRow {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  currency: SupportedCurrency;
  price_amount: number;
  status: WishlistItemStatus;
  funded_by_gift_id: string | null;
  funded_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function isWishlistItemStatus(
  value: unknown,
): value is WishlistItemStatus {
  return (
    typeof value === "string" &&
    (WISHLIST_ITEM_STATUSES as readonly string[]).includes(value)
  );
}

/** Statuses shown on the public creator page. Mirrors the RLS select policy. */
export function isPubliclyVisible(status: WishlistItemStatus): boolean {
  return status === "active" || status === "funded";
}

export function isFunded(item: Pick<WishlistItemRow, "status">): boolean {
  return item.status === "funded";
}

/**
 * Creator-driven lifecycle moves. 'funded' is intentionally NOT reachable from
 * any of these — only the verified webhook path sets it (see funding.ts), so a
 * creator can never fake a purchase. A funded item can only be archived.
 */
const WISHLIST_TRANSITIONS: Record<
  WishlistItemStatus,
  readonly WishlistItemStatus[]
> = {
  draft: ["active", "archived"],
  active: ["draft", "archived"],
  funded: ["archived"],
  archived: ["draft"],
};

export function canTransitionWishlistItem(
  from: WishlistItemStatus,
  to: WishlistItemStatus,
): boolean {
  return WISHLIST_TRANSITIONS[from].includes(to);
}
