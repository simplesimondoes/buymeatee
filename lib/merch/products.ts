import "server-only";

import { getMerchPricingConfig } from "@/lib/merch/config";
import { getCuratedProductByIdInternal } from "@/lib/merch/catalogue";
import { calculateMerchPricing } from "@/lib/merch/pricing";
import { getCatalogProduct } from "@/lib/printful/catalogue";
import { getPrintfulClientOrNull } from "@/lib/printful/client";
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
  placement_configuration: { previewUrl?: string | null } | null;
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
  "id, creator_id, curated_product_id, title, slug, description, status, artwork_file_id, placement, placement_configuration, selected_variant_ids, selected_colours, selected_sizes, currency, retail_price_minor, estimated_printful_cost_minor, estimated_platform_fee_minor, estimated_creator_profit_minor, mockup_status, moderation_status, moderation_notes, version, published_at, created_at, updated_at";

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

/** Input for creating a product — variant ids are resolved server-side. */
export type CreateProductInput = Omit<ProductConfigurationInput, "selectedVariantIds"> & {
  curatedProductId: string;
  /** Optional uploaded artwork to attach (from /api/merch/artwork). */
  artworkFileId?: string | null;
};

/**
 * Resolve the real Printful variant ids (and the worst-case unit cost) for the
 * chosen colour×size combinations, restricted to the curated allow-list. One
 * Printful call. Returns empty ids when Printful is unavailable or nothing
 * matches.
 */
async function resolveSelectedVariants(
  printfulProductId: number,
  allowedVariantIds: number[],
  colours: string[],
  sizes: string[],
): Promise<{ variantIds: number[]; unitCostMinor: number | null }> {
  const client = getPrintfulClientOrNull();
  if (!client) {
    return { variantIds: [], unitCostMinor: null };
  }
  try {
    const detail = await getCatalogProduct(client, printfulProductId);
    const allowed = new Set(allowedVariantIds);
    const colourSet = new Set(colours);
    const sizeSet = new Set(sizes);
    const matched = detail.variants.filter(
      (v) =>
        allowed.has(v.id) &&
        (v.color ? colourSet.has(v.color) : false) &&
        (v.size ? sizeSet.has(v.size) : false),
    );
    const costs = matched.map((v) => v.priceMinor);
    return {
      variantIds: matched.map((v) => v.id),
      unitCostMinor: costs.length > 0 ? Math.max(...costs) : null,
    };
  } catch {
    return { variantIds: [], unitCostMinor: null };
  }
}

/** A single published product for the public shop, by creator + slug. */
export async function getPublishedProductBySlug(
  creatorId: string,
  slug: string,
): Promise<MerchProductRow | null> {
  const supabase = getSupabaseAnonClient();
  const { data } = await supabase
    .from("merch_products")
    .select(PRODUCT_COLUMNS)
    .eq("creator_id", creatorId)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as MerchProductRow | null) ?? null;
}

/** Create a draft product against a curated product the admin has enabled. */
export async function createProduct(
  userId: string,
  input: CreateProductInput,
): Promise<ProductMutationResult> {
  try {
    const curated = await getCuratedProductByIdInternal(input.curatedProductId);
    if (!curated || !curated.enabled) {
      return { ok: false, reason: "curated_unavailable" };
    }

    // Resolve the real Printful variant ids for the chosen colour×size, plus a
    // worst-case unit cost for the margin check and stored estimates.
    const { variantIds, unitCostMinor } = await resolveSelectedVariants(
      curated.printfulCatalogProductId,
      curated.allowedVariantIds,
      input.selectedColours,
      input.selectedSizes,
    );
    if (variantIds.length === 0) {
      return { ok: false, reason: "invalid_configuration", errors: ["no-variants-selected"] };
    }

    const fullInput: ProductConfigurationInput = { ...input, selectedVariantIds: variantIds };
    const printfulUnitCostMinor = unitCostMinor;
    const validation = validateProductConfiguration(
      fullInput,
      curated,
      getMerchPricingConfig(),
      printfulUnitCostMinor ?? undefined,
    );
    if (!validation.ok) {
      return { ok: false, reason: "invalid_configuration", errors: validation.errors };
    }

    // Compute the estimate to store (null cost → estimates stay null).
    let estCost: number | null = null;
    let estFee: number | null = null;
    let estProfit: number | null = null;
    if (printfulUnitCostMinor !== null) {
      const pricing = calculateMerchPricing(
        {
          currency: input.currency,
          retailUnitPriceMinor: input.retailPriceMinor,
          quantity: 1,
          printfulUnitCostMinor,
        },
        getMerchPricingConfig(),
      );
      if (pricing.ok) {
        estCost = printfulUnitCostMinor;
        estFee = pricing.breakdown.platformFeeMinor;
        estProfit = pricing.breakdown.creatorProfitMinor;
      }
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
        artwork_file_id: input.artworkFileId ?? null,
        placement: input.placement,
        selected_variant_ids: variantIds,
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

    // Estimates are service-role only (no client grant), so set them with the
    // admin client after the draft is created. Best-effort — a failure here
    // just leaves the estimates null (shown as "—" until recomputed).
    let product = data as MerchProductRow;
    if (estProfit !== null) {
      try {
        const admin = getSupabaseAdminClient();
        const { data: updated } = await admin
          .from("merch_products")
          .update({
            estimated_printful_cost_minor: estCost,
            estimated_platform_fee_minor: estFee,
            estimated_creator_profit_minor: estProfit,
          })
          .eq("id", product.id)
          .select(PRODUCT_COLUMNS)
          .maybeSingle();
        if (updated) product = updated as MerchProductRow;
      } catch {
        // Keep the draft; estimates stay null.
      }
    }
    return { ok: true, product };
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

/** Public URL of a product's artwork (covers bucket), or null. */
async function artworkPublicUrl(artworkFileId: string | null): Promise<string | null> {
  if (!artworkFileId) return null;
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("merch_artwork_files")
    .select("storage_path")
    .eq("id", artworkFileId)
    .maybeSingle();
  const path = (data as { storage_path: string } | null)?.storage_path;
  if (!path) return null;
  return admin.storage.from("covers").getPublicUrl(path).data.publicUrl;
}

/**
 * Mark a product's preview ready (spec §9). MVP uses the uploaded artwork as
 * the preview image (real async Printful mockups are a documented enhancement);
 * this stores the preview URL and flips mockup_status → ready so the product can
 * be submitted for review. Service-role (mockup_status has no client grant).
 */
export async function markPreviewReady(
  userId: string,
  productId: string,
): Promise<ProductMutationResult> {
  try {
    const existing = await getOwnProduct(userId, productId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    if (!existing.artwork_file_id) {
      return { ok: false, reason: "invalid_state" };
    }
    const previewUrl = await artworkPublicUrl(existing.artwork_file_id);
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("merch_products")
      .update({
        mockup_status: "ready",
        placement_configuration: { placement: existing.placement, previewUrl },
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
 * Publish an approved product (spec §11). Requires moderation approval and a
 * ready preview. Sets status=published + published_at via the admin client
 * (published_at has no client grant), guarded by ownership + source state.
 */
export async function publishProduct(
  userId: string,
  productId: string,
): Promise<ProductMutationResult> {
  try {
    const existing = await getOwnProduct(userId, productId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    if (
      existing.status !== "approved" ||
      existing.moderation_status !== "approved" ||
      existing.mockup_status !== "ready"
    ) {
      return { ok: false, reason: "invalid_state" };
    }
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("merch_products")
      .update({
        status: "published" satisfies MerchProductStatus,
        published_at: new Date().toISOString(),
      })
      .eq("creator_id", userId)
      .eq("id", productId)
      .eq("status", "approved")
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

/** Pause (unpublish) or resume a product. Status is client-writable via RLS. */
export async function setProductPaused(
  userId: string,
  productId: string,
  paused: boolean,
): Promise<ProductMutationResult> {
  try {
    const existing = await getOwnProduct(userId, productId);
    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    const from: MerchProductStatus = paused ? "published" : "paused";
    const to: MerchProductStatus = paused ? "paused" : "published";
    if (existing.status !== from) {
      return { ok: false, reason: "invalid_state" };
    }
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("merch_products")
      .update({ status: to })
      .eq("creator_id", userId)
      .eq("id", productId)
      .eq("status", from)
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
