import type { ProductConfigurationInput } from "@/lib/merch/product-validation";

/**
 * Structural parsing of untrusted product input from the API (ADR-024).
 *
 * This only coerces + type-checks the JSON shape; the business rules (curated
 * allow-lists, margin, slug format) live in validateProductConfiguration and
 * run inside the service layer. Keeping the two separate means the route can
 * reject malformed requests early with a generic code, while the richer,
 * field-level validation errors come back as stable merch codes.
 */

export interface ParsedProductInput extends ProductConfigurationInput {
  curatedProductId: string;
}

export type ProductInputParseResult =
  | { ok: true; data: ParsedProductInput }
  | { ok: false };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => typeof v === "number" && Number.isInteger(v));
}

export function parseProductInput(payload: unknown): ProductInputParseResult {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false };
  }
  const p = payload as Record<string, unknown>;

  if (
    typeof p.curatedProductId !== "string" ||
    typeof p.title !== "string" ||
    typeof p.slug !== "string" ||
    typeof p.currency !== "string" ||
    typeof p.retailPriceMinor !== "number" ||
    !Number.isInteger(p.retailPriceMinor) ||
    typeof p.placement !== "string" ||
    !isNumberArray(p.selectedVariantIds) ||
    !isStringArray(p.selectedColours) ||
    !isStringArray(p.selectedSizes)
  ) {
    return { ok: false };
  }
  if (p.description !== undefined && p.description !== null && typeof p.description !== "string") {
    return { ok: false };
  }

  return {
    ok: true,
    data: {
      curatedProductId: p.curatedProductId,
      title: p.title,
      slug: p.slug,
      description: (p.description as string | null | undefined) ?? null,
      currency: p.currency as ParsedProductInput["currency"],
      retailPriceMinor: p.retailPriceMinor,
      placement: p.placement,
      selectedVariantIds: p.selectedVariantIds,
      selectedColours: p.selectedColours,
      selectedSizes: p.selectedSizes,
    },
  };
}
