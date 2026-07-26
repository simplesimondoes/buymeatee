import "server-only";

import { getMerchPricingConfig } from "@/lib/merch/config";
import { getCuratedProductByIdInternal } from "@/lib/merch/catalogue";
import {
  validateProductConfiguration,
  type ProductConfigurationInput,
  type ProductValidationError,
} from "@/lib/merch/product-validation";
import type {
  MerchModerationStatus,
  MerchProductStatus,
} from "@/lib/merch/types";
import { markProfileAsCreator } from "@/lib/profile/role";
import type { SupportedCurrency } from "@/lib/payments/currency";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAnonClient } from "@/lib/supabase/anon";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Creator merchandise product reads + mutations (ADR-024, spec §10).
 *
 * Listing edits run on the session client so RLS confines them to the caller's
 * own products, and the service-role columns (moderation_status,
 * submitted_for_review_at, pricing estimates, mockup + Printful ids) have no
 * client write grant. Submit-for-review and any state that touches those columns
 * go through the admin client behind an explicit ownership check.
 */

export interface MerchProductRow {
  id: string;
  creator_id: string;
  curated_product_id: string;
  title: string;
  slug: string;
  description: string | null;
  status: MerchProductStatus;
  artwork_file_id: string | null;
  placement: string | null;
  selected_variant_ids: number[] | null;
  selected_colours: string[] | null;
  selected_sizes: string[] | null;
  currency: SupportedCurrency;
  retail_price_minor: number;
  estimated_printful_cost_minor: number | null;
  estimated_platform_fee_minor: number | null;
  estimated_creator_profit_minor: number | null;
  mockup_status: string;
  moderation_status: MerchModerationStatus;
  moderation_notes: string | null;
  version: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const PRODUCT_COLUMNS =
  "id, creator_id, curated_product_id, title, slug, description, status, artwork_file_id, placement, selected_variant_ids, selected_colours, selected_sizes, currency, retail_price_minor, estimated_printful_cost_minor, estimated_platform_fee_minor, estimated_creator_profit_minor, mockup_status, moderation_status, moderation_notes, version, published_at, created_at, updated_at";

export type ProductMutationResult =
  | { ok: true; product: MerchProductRow }
  | { ok: false; reason: ProductMutationFailure; errors?: ProductValidationError[] };

export type ProductMutationFailure =
  | "not_found"
  | "curated_unavailable"
  | "invalid_configuration"
  | "invalid_state"
  | "unavailable";

export async function getOwnProducts(userId: string): Promise<MerchProductRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("merch_products")
    .select(PRODUCT_COLUMNS)
    .eq("creator_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to load merch products: ${error.message}`);
  }
  return (data as MerchProductRow[]) ?? [];
}

export async function getOwnProduct(
  userId: string,
  productId: string,
): Promise<MerchProductRow | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("merch_products")
    .select(PRODUCT_COLUMNS)
    .eq("creator_id", userId)
    .eq("id", productId)
    .maybeSingle();
  return (data as MerchProductRow | null) ?? null;
}

/** Published products for a public shop (anon client; RLS gates on status). */
export async function getPublishedProductsForCreator(
  creatorId: string,
): Promise<MerchProductRow[]> {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase
    .from("merch_products")
    .select(PRODUCT_COLUMNS)
    .eq("creator_id", creatorId)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) {
    return [];
  }
  return (data as MerchProductRow[]) ?? [];
}

/** Create a draft product against a curated product the admin has enabled. */
export async function createProduct(
  userId: string,
  input: ProductConfigurationInput & { curatedProductId: string },
): Promise<ProductMutationResult> {
  try {
    const curated = await getCuratedProductByIdInternal(input.curatedProductId);
    if (!curated || !curated.enabled) {
      return { ok: false, reason: "curated_unavailable" };
    }
    // Validate selections against the curated allow-lists. The margin check is
    // skipped here (Printful cost not resolved yet); it runs at submit time.
    const validation = validateProductConfiguration(input, curated, getMerchPricingConfig());
    if (!validation.ok) {
      return { ok: false, reason: "invalid_configuration", errors: validation.errors };
    }

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("merch_products")
      .insert({
        creator_id: userId,
        curated_product_id: input.curatedProductId,
        title: input.title,
        slug: input.slug,
        description: input.description ?? null,
        status: "draft",
        placement: input.placement,
        selected_variant_ids: input.selectedVariantIds,
        selected_colours: input.selectedColours,
        selected_sizes: input.selectedSizes,
        currency: input.currency,
        retail_price_minor: input.retailPriceMinor,
      })
      .select(PRODUCT_COLUMNS)
      .single();
    if (error || !data) {
      return { ok: false, reason: "unavailable" };
    }
    await markProfileAsCreator(userId);
    return { ok: true, product: data as MerchProductRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/** Update a product's listing fields (validated against its curated product). */
export async function updateProduct(
  userId: string,
  productId: string,
  input: ProductConfigurationInput,
): Promise<ProductMutationResult> {
  try {
    const existing = await getOwnProduct(userId, productId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    // Only editable while not live / under review — published edits create a
    // new version via a separate flow (immutable order snapshots, spec §10).
    if (!["draft", "changes_requested"].includes(existing.status)) {
      return { ok: false, reason: "invalid_state" };
    }
    const curated = await getCuratedProductByIdInternal(existing.curated_product_id);
    if (!curated) {
      return { ok: false, reason: "curated_unavailable" };
    }
    const validation = validateProductConfiguration(input, curated, getMerchPricingConfig());
    if (!validation.ok) {
      return { ok: false, reason: "invalid_configuration", errors: validation.errors };
    }

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("merch_products")
      .update({
        title: input.title,
        slug: input.slug,
        description: input.description ?? null,
        placement: input.placement,
        selected_variant_ids: input.selectedVariantIds,
        selected_colours: input.selectedColours,
        selected_sizes: input.selectedSizes,
        currency: input.currency,
        retail_price_minor: input.retailPriceMinor,
      })
      .eq("creator_id", userId)
      .eq("id", productId)
      .select(PRODUCT_COLUMNS)
      .maybeSingle();
    if (error || !data) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: true, product: data as MerchProductRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Submit a product for moderation (spec §10/§24). Uses the admin client because
 * moderation_status + submitted_for_review_at have no client write grant. Gated
 * by an explicit ownership filter and a valid source state. Requires mockups to
 * be ready so moderators review the real artwork.
 */
export async function submitForReview(
  userId: string,
  productId: string,
): Promise<ProductMutationResult> {
  try {
    const existing = await getOwnProduct(userId, productId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    if (!["draft", "changes_requested"].includes(existing.status)) {
      return { ok: false, reason: "invalid_state" };
    }
    if (existing.mockup_status !== "ready") {
      return { ok: false, reason: "invalid_state" };
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("merch_products")
      .update({
        status: "awaiting_approval" satisfies MerchProductStatus,
        moderation_status: "pending" satisfies MerchModerationStatus,
        submitted_for_review_at: new Date().toISOString(),
        moderation_notes: null,
      })
      .eq("creator_id", userId)
      .eq("id", productId)
      .eq("status", existing.status)
      .select(PRODUCT_COLUMNS)
      .maybeSingle();
    if (error || !data) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: true, product: data as MerchProductRow };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
