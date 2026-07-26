import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAnonClient } from "@/lib/supabase/anon";
import type { CuratedProduct } from "@/lib/merch/types";
import { isSupportedCurrency } from "@/lib/payments/currency";
import type { PrintfulProductDetail } from "@/lib/printful/types";

/**
 * Curated catalogue reads + admin curation helpers (ADR-024, spec §6).
 *
 * The curated catalogue is an ADMIN-managed subset of the Printful catalogue —
 * creators never see the full catalogue. Public/creator reads use the anon
 * client (RLS exposes only enabled rows, internal_notes withheld). Admin writes
 * use the service-role client from the admin catalogue workflow. buildCuratedDraftFromPrintful
 * is a pure mapper so the admin sync is unit-testable.
 */

const CURATED_PUBLIC_COLUMNS =
  "id, printful_catalog_product_id, slug, display_name, description, category, enabled, featured, sort_order, allowed_variant_ids, allowed_colours, allowed_sizes, allowed_placements, default_placement, supported_regions, currency, minimum_retail_price_minor, minimum_creator_profit_minor";

interface CuratedRow {
  id: string;
  printful_catalog_product_id: number;
  slug: string;
  display_name: string;
  description: string | null;
  category: string | null;
  enabled: boolean;
  featured: boolean;
  sort_order: number;
  allowed_variant_ids: number[] | null;
  allowed_colours: string[] | null;
  allowed_sizes: string[] | null;
  allowed_placements: string[] | null;
  default_placement: string | null;
  supported_regions: string[] | null;
  currency: string;
  minimum_retail_price_minor: number;
  minimum_creator_profit_minor: number;
}

function rowToCuratedProduct(row: CuratedRow): CuratedProduct {
  return {
    id: row.id,
    printfulCatalogProductId: row.printful_catalog_product_id,
    slug: row.slug,
    displayName: row.display_name,
    description: row.description,
    category: row.category,
    enabled: row.enabled,
    featured: row.featured,
    sortOrder: row.sort_order,
    allowedVariantIds: row.allowed_variant_ids ?? [],
    allowedColours: row.allowed_colours ?? [],
    allowedSizes: row.allowed_sizes ?? [],
    allowedPlacements: row.allowed_placements ?? [],
    defaultPlacement: row.default_placement,
    supportedRegions: row.supported_regions ?? [],
    // The DB constrains currency to payment_currency; guard anyway.
    currency: isSupportedCurrency(row.currency) ? row.currency : "gbp",
    minimumRetailPriceMinor: row.minimum_retail_price_minor,
    minimumCreatorProfitMinor: row.minimum_creator_profit_minor,
  };
}

/** All enabled curated products, for the creator wizard and public shop. */
export async function getEnabledCuratedProducts(): Promise<CuratedProduct[]> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("merch_curated_products")
    .select(CURATED_PUBLIC_COLUMNS)
    .eq("enabled", true)
    .order("sort_order", { ascending: true })
    .order("display_name", { ascending: true });
  if (error) {
    throw new Error(`Failed to load curated products: ${error.message}`);
  }
  return ((data as CuratedRow[]) ?? []).map(rowToCuratedProduct);
}

export async function getCuratedProductBySlug(
  slug: string,
): Promise<CuratedProduct | null> {
  const supabase = getSupabaseAnonClient();
  const { data } = await supabase
    .from("merch_curated_products")
    .select(CURATED_PUBLIC_COLUMNS)
    .eq("slug", slug)
    .eq("enabled", true)
    .maybeSingle();
  return data ? rowToCuratedProduct(data as CuratedRow) : null;
}

/** Service-role lookup by id (enabled or not) for internal/admin flows. */
export async function getCuratedProductByIdInternal(
  id: string,
): Promise<CuratedProduct | null> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("merch_curated_products")
    .select(CURATED_PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return data ? rowToCuratedProduct(data as CuratedRow) : null;
}

export interface CuratedDraftOverrides {
  slug: string;
  displayName?: string;
  category?: string;
  allowedVariantIds?: number[];
  allowedColours?: string[];
  allowedSizes?: string[];
  allowedPlacements?: string[];
  defaultPlacement?: string;
  supportedRegions?: string[];
  currency: string;
  minimumRetailPriceMinor?: number;
  minimumCreatorProfitMinor?: number;
}

/**
 * Pure mapper: turn a live Printful product detail + an admin's curation choices
 * into a curated-product insert payload (service-role columns). The admin
 * always chooses the slug, currency and which variants/colours/sizes to expose;
 * unspecified allow-lists default to everything the Printful product offers, so
 * an admin can start broad and prune. Product stays DISABLED until the admin
 * explicitly enables it.
 */
export function buildCuratedDraftFromPrintful(
  detail: PrintfulProductDetail,
  overrides: CuratedDraftOverrides,
): Record<string, unknown> {
  const allVariantIds = detail.variants.map((v) => v.id);
  const allColours = Array.from(
    new Set(detail.variants.map((v) => v.color).filter((c): c is string => Boolean(c))),
  );
  const allSizes = Array.from(
    new Set(detail.variants.map((v) => v.size).filter((s): s is string => Boolean(s))),
  );
  return {
    printful_catalog_product_id: detail.product.id,
    slug: overrides.slug,
    display_name: overrides.displayName ?? detail.product.title,
    description: detail.product.description || null,
    category: overrides.category ?? (detail.product.type || null),
    enabled: false,
    featured: false,
    allowed_variant_ids: overrides.allowedVariantIds ?? allVariantIds,
    allowed_colours: overrides.allowedColours ?? allColours,
    allowed_sizes: overrides.allowedSizes ?? allSizes,
    allowed_placements: overrides.allowedPlacements ?? [],
    default_placement: overrides.defaultPlacement ?? null,
    supported_regions: overrides.supportedRegions ?? [],
    currency: overrides.currency,
    minimum_retail_price_minor: overrides.minimumRetailPriceMinor ?? 0,
    minimum_creator_profit_minor: overrides.minimumCreatorProfitMinor ?? 0,
  };
}

/**
 * Upsert a curated product (admin only) keyed on the Printful catalog product
 * id, so re-syncing the same Printful product updates the existing row rather
 * than duplicating it.
 */
export async function upsertCuratedProduct(
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("merch_curated_products")
      .upsert(payload, { onConflict: "printful_catalog_product_id" })
      .select("id")
      .single();
    if (error || !data) {
      return { ok: false, error: error?.message };
    }
    return { ok: true, id: (data as { id: string }).id };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
