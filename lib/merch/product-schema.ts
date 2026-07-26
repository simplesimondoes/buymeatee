import type { CreateProductInput } from "@/lib/merch/products";
import type { SupportedCurrency } from "@/lib/payments/currency";

/**
 * Structural parsing of untrusted product input from the API (ADR-024).
 *
 * This only coerces + type-checks the JSON shape; the business rules (curated
 * allow-lists, margin, slug format) live in validateProductConfiguration and
 * run inside the service layer. The client sends the chosen colours + sizes;
 * the real Printful variant ids are resolved server-side in createProduct.
 */

export type ProductInputParseResult =
  | { ok: true; data: CreateProductInput }
  | { ok: false };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
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
      currency: p.currency as SupportedCurrency,
      retailPriceMinor: p.retailPriceMinor,
      placement: p.placement,
      selectedColours: p.selectedColours,
      selectedSizes: p.selectedSizes,
      artworkFileId: typeof p.artworkFileId === "string" ? p.artworkFileId : null,
    },
  };
}
