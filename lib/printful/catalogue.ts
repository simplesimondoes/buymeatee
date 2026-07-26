import "server-only";

import type { PrintfulClient } from "@/lib/printful/client";
import {
  parseCatalogProductDetail,
  parseCatalogProductList,
} from "@/lib/printful/schemas";
import type {
  PrintfulCatalogListItem,
  PrintfulProductDetail,
} from "@/lib/printful/types";

/** The full catalogue product list (GET /products) — used for admin search. */
export function getCatalogProducts(
  client: PrintfulClient,
): Promise<PrintfulCatalogListItem[]> {
  return client.request({
    method: "GET",
    path: "/products",
    parse: parseCatalogProductList,
  });
}

/**
 * Printful catalogue reads (ADR-024). Used by the ADMIN catalogue-curation
 * workflow to load live product + variant data — never to expose the full
 * catalogue to creators (spec §6). GETs are retried by the client.
 */

/** Load a catalogue product and its variants (prices normalised to minor units). */
export function getCatalogProduct(
  client: PrintfulClient,
  catalogProductId: number,
): Promise<PrintfulProductDetail> {
  return client.request({
    method: "GET",
    path: `/products/${encodeURIComponent(String(catalogProductId))}`,
    parse: parseCatalogProductDetail,
  });
}
