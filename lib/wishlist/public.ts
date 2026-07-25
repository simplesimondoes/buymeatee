import "server-only";

import { getSupabaseAnonClient } from "@/lib/supabase/anon";
import type { WishlistItemRow } from "@/lib/wishlist/types";

/**
 * Public reads of a creator's wish list. Deliberately on the anonymous client:
 * the RLS policy ("published wish-list items are viewable by everyone") is what
 * keeps drafts and archived items invisible — not a filter someone could
 * forget. The status split below only shapes ordering within what RLS exposes.
 */

const PUBLIC_ITEM_COLUMNS =
  "id, creator_id, title, description, image_url, currency, price_amount, status, funded_by_gift_id, funded_at, sort_order, created_at, updated_at";

export interface PublicWishlist {
  /** Fundable now, in the creator's chosen order. */
  available: WishlistItemRow[];
  /** Already funded — proof supporters make real things happen. */
  funded: WishlistItemRow[];
}

export async function getPublicWishlistForCreator(
  creatorId: string,
): Promise<PublicWishlist> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select(PUBLIC_ITEM_COLUMNS)
    .eq("creator_id", creatorId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`Failed to load public wish list: ${error.message}`);
  }
  const items = (data as WishlistItemRow[]) ?? [];
  return {
    available: items.filter((item) => item.status === "active"),
    funded: items
      .filter((item) => item.status === "funded")
      .sort((a, b) =>
        (b.funded_at ?? b.updated_at).localeCompare(a.funded_at ?? a.updated_at),
      ),
  };
}
