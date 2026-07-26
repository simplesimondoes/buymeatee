import {
  calculateMerchPricing,
  type MerchPricingConfig,
} from "@/lib/merch/pricing";
import type { CuratedProduct } from "@/lib/merch/types";
import {
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/payments/currency";

/**
 * Creator product configuration validation (Printful merch MVP, ADR-024,
 * spec §8/§10). Pure module — every selection is checked against the admin's
 * curated allow-lists so a creator can never configure a variant/colour/size/
 * placement the platform hasn't approved, nor price below the margin floor.
 */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface ProductConfigurationInput {
  title: string;
  slug: string;
  description?: string | null;
  currency: SupportedCurrency;
  retailPriceMinor: number;
  selectedVariantIds: number[];
  selectedColours: string[];
  selectedSizes: string[];
  placement: string;
}

export type ProductValidationError =
  | "title-required"
  | "title-too-long"
  | "invalid-slug"
  | "description-too-long"
  | "unsupported-currency"
  | "no-variants-selected"
  | "variant-not-allowed"
  | "colour-not-allowed"
  | "size-not-allowed"
  | "placement-not-allowed"
  | "below-minimum-price"
  | "pricing-invalid";

export interface ProductValidationOk {
  ok: true;
  /** The computed unit creator profit (minor units) at the chosen price. */
  creatorProfitMinor: number;
  platformFeeMinor: number;
}

export type ProductValidationResult =
  | ProductValidationOk
  | { ok: false; errors: ProductValidationError[] };

function isSubset(selected: readonly (string | number)[], allowed: readonly (string | number)[]): boolean {
  const set = new Set(allowed);
  return selected.every((value) => set.has(value));
}

/**
 * Validate a product configuration against its curated product and the pricing
 * config. `printfulUnitCostMinor` is the Printful wholesale cost for the chosen
 * variants (resolved server-side); when unknown (e.g. an early draft) pass
 * undefined to skip the margin check and validate only the selections.
 */
export function validateProductConfiguration(
  input: ProductConfigurationInput,
  curated: CuratedProduct,
  pricingConfig: MerchPricingConfig,
  printfulUnitCostMinor?: number,
): ProductValidationResult {
  const errors: ProductValidationError[] = [];

  const title = input.title?.trim() ?? "";
  if (title.length === 0) {
    errors.push("title-required");
  } else if (title.length > 120) {
    errors.push("title-too-long");
  }

  if (!SLUG_RE.test(input.slug ?? "")) {
    errors.push("invalid-slug");
  }

  if ((input.description?.length ?? 0) > 2000) {
    errors.push("description-too-long");
  }

  if (!isSupportedCurrency(input.currency)) {
    errors.push("unsupported-currency");
  }

  if (!input.selectedVariantIds || input.selectedVariantIds.length === 0) {
    errors.push("no-variants-selected");
  } else if (!isSubset(input.selectedVariantIds, curated.allowedVariantIds)) {
    errors.push("variant-not-allowed");
  }

  if (!isSubset(input.selectedColours, curated.allowedColours)) {
    errors.push("colour-not-allowed");
  }

  if (!isSubset(input.selectedSizes, curated.allowedSizes)) {
    errors.push("size-not-allowed");
  }

  if (!curated.allowedPlacements.includes(input.placement)) {
    errors.push("placement-not-allowed");
  }

  if (input.retailPriceMinor < curated.minimumRetailPriceMinor) {
    errors.push("below-minimum-price");
  }

  // Margin check only when the Printful cost is known and the selections and
  // currency are otherwise valid (avoids a misleading pricing error stacked on
  // a currency error).
  let creatorProfitMinor = 0;
  let platformFeeMinor = 0;
  if (printfulUnitCostMinor !== undefined && isSupportedCurrency(input.currency)) {
    const pricing = calculateMerchPricing(
      {
        currency: input.currency,
        retailUnitPriceMinor: input.retailPriceMinor,
        quantity: 1,
        printfulUnitCostMinor,
      },
      pricingConfig,
    );
    if (!pricing.ok) {
      errors.push("pricing-invalid");
    } else {
      creatorProfitMinor = pricing.breakdown.creatorProfitMinor;
      platformFeeMinor = pricing.breakdown.platformFeeMinor;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, creatorProfitMinor, platformFeeMinor };
}
