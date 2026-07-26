import "server-only";

import {
  buildCuratedDraftFromPrintful,
  upsertCuratedProduct,
} from "@/lib/merch/catalogue";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { cache } from "react";

import { getCatalogProduct, getCatalogProducts } from "@/lib/printful/catalogue";
import { getPrintfulClientOrNull } from "@/lib/printful/client";
import type { PrintfulCatalogListItem } from "@/lib/printful/types";
import {
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/payments/currency";

/**
 * Admin catalogue curation (ADR-024, spec §6). Loads a live Printful product,
 * lets an admin expose a chosen subset of its colours/sizes, and saves a
 * curated product with the REAL Printful variant ids resolved from the chosen
 * colour×size combinations. Owner/admin-gated at the route. Never exposes the
 * full Printful catalogue to creators.
 */

export interface PrintfulSearchResult {
  id: number;
  title: string;
  typeName: string;
  brand: string | null;
  imageUrl: string | null;
  variantCount: number;
}

// Cache the (large, ~500-item) catalogue list within a request so repeated
// searches don't re-fetch it.
const loadCatalogue = cache(async (): Promise<PrintfulCatalogListItem[]> => {
  const client = getPrintfulClientOrNull();
  if (!client) return [];
  try {
    return await getCatalogProducts(client);
  } catch {
    return [];
  }
});

/**
 * Search the Printful catalogue by name/type (e.g. "hoodie", "polo", "tee") so
 * an admin never has to know a numeric product id. Returns the top matches.
 */
export async function searchPrintfulProducts(
  query: string,
): Promise<{ ok: true; results: PrintfulSearchResult[] } | { ok: false; error: string }> {
  const client = getPrintfulClientOrNull();
  if (!client) {
    return { ok: false, error: "printful-not-configured" };
  }
  const all = await loadCatalogue();
  const q = query.trim().toLowerCase();
  const matches = (q
    ? all.filter((p) =>
        `${p.title} ${p.type} ${p.typeName} ${p.brand ?? ""}`.toLowerCase().includes(q),
      )
    : all
  )
    .slice(0, 40)
    .map((p) => ({
      id: p.id,
      title: p.title,
      typeName: p.typeName,
      brand: p.brand,
      imageUrl: p.imageUrl,
      variantCount: p.variantCount,
    }));
  return { ok: true, results: matches };
}

export interface PrintfulProductOptions {
  printfulProductId: number;
  title: string;
  brand: string | null;
  /** The Printful catalogue currency (what Printful bills the platform in). */
  currency: string;
  colours: string[];
  sizes: string[];
  variantCount: number;
}

/** Load a Printful product's available colours/sizes for the curation form. */
export async function getPrintfulProductOptions(
  printfulProductId: number,
): Promise<{ ok: true; options: PrintfulProductOptions } | { ok: false; error: string }> {
  const client = getPrintfulClientOrNull();
  if (!client) {
    return { ok: false, error: "printful-not-configured" };
  }
  try {
    const detail = await getCatalogProduct(client, printfulProductId);
    const colours = Array.from(
      new Set(detail.variants.map((v) => v.color).filter((c): c is string => Boolean(c))),
    ).sort();
    const sizes = Array.from(
      new Set(detail.variants.map((v) => v.size).filter((s): s is string => Boolean(s))),
    );
    return {
      ok: true,
      options: {
        printfulProductId: detail.product.id,
        title: detail.product.title,
        brand: detail.product.brand,
        currency: (detail.variants[0]?.currency ?? "usd").toLowerCase(),
        colours,
        sizes,
        variantCount: detail.variants.length,
      },
    };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export interface AdminCuratedRow {
  id: string;
  slug: string;
  displayName: string;
  printfulCatalogProductId: number;
  currency: string;
  enabled: boolean;
  variantCount: number;
}

/** List all curated products (enabled or not) for the admin view. */
export async function listAllCuratedProductsForAdmin(): Promise<AdminCuratedRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("merch_curated_products")
    .select("id, slug, display_name, printful_catalog_product_id, currency, enabled, allowed_variant_ids")
    .order("sort_order", { ascending: true })
    .order("display_name", { ascending: true });
  if (error) {
    return [];
  }
  return (
    (data as Array<{
      id: string;
      slug: string;
      display_name: string;
      printful_catalog_product_id: number;
      currency: string;
      enabled: boolean;
      allowed_variant_ids: number[] | null;
    }> | null) ?? []
  ).map((r) => ({
    id: r.id,
    slug: r.slug,
    displayName: r.display_name,
    printfulCatalogProductId: r.printful_catalog_product_id,
    currency: r.currency,
    enabled: r.enabled,
    variantCount: (r.allowed_variant_ids ?? []).length,
  }));
}

export interface CurateProductInput {
  printfulProductId: number;
  slug: string;
  displayName?: string;
  category?: string;
  currency: SupportedCurrency;
  colours: string[];
  sizes: string[];
  placements: string[];
  defaultPlacement?: string;
  minimumRetailPriceMinor?: number;
  minimumCreatorProfitMinor?: number;
  enabled?: boolean;
}

export type CurateResult =
  | { ok: true; id: string; variantCount: number }
  | { ok: false; error: string };

/**
 * Curate a Printful product into the catalogue. Resolves the exact Printful
 * variant ids for the chosen colour×size combinations, verifies the Printful
 * catalogue currency matches the chosen sell currency (so margins never mix
 * currencies), and upserts the curated product keyed on the Printful id.
 */
export async function curateProductFromPrintful(
  input: CurateProductInput,
): Promise<CurateResult> {
  if (!isSupportedCurrency(input.currency)) {
    return { ok: false, error: "unsupported-currency" };
  }
  const client = getPrintfulClientOrNull();
  if (!client) {
    return { ok: false, error: "printful-not-configured" };
  }

  let detail;
  try {
    detail = await getCatalogProduct(client, input.printfulProductId);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }

  // Printful bills in its catalogue currency; a curated product must sell in
  // that same currency or margins would mix currencies at checkout.
  const catalogueCurrency = (detail.variants[0]?.currency ?? "").toLowerCase();
  if (catalogueCurrency && catalogueCurrency !== input.currency) {
    return { ok: false, error: `currency-mismatch:${catalogueCurrency}` };
  }

  const colourSet = new Set(input.colours);
  const sizeSet = new Set(input.sizes);
  const matched = detail.variants.filter(
    (v) =>
      (input.colours.length === 0 || (v.color && colourSet.has(v.color))) &&
      (input.sizes.length === 0 || (v.size && sizeSet.has(v.size))),
  );
  if (matched.length === 0) {
    return { ok: false, error: "no-matching-variants" };
  }

  const payload = buildCuratedDraftFromPrintful(detail, {
    slug: input.slug,
    displayName: input.displayName,
    category: input.category,
    currency: input.currency,
    allowedVariantIds: matched.map((v) => v.id),
    allowedColours: input.colours.length > 0 ? input.colours : undefined,
    allowedSizes: input.sizes.length > 0 ? input.sizes : undefined,
    allowedPlacements: input.placements,
    defaultPlacement: input.defaultPlacement,
    minimumRetailPriceMinor: input.minimumRetailPriceMinor,
    minimumCreatorProfitMinor: input.minimumCreatorProfitMinor,
  });
  // Admin decides whether the curated product is immediately live.
  payload.enabled = input.enabled ?? false;

  const result = await upsertCuratedProduct(payload);
  if (!result.ok || !result.id) {
    return { ok: false, error: result.error ?? "save-failed" };
  }
  return { ok: true, id: result.id, variantCount: matched.length };
}
