import "server-only";

import { cache } from "react";

import { getEnabledCuratedProducts } from "@/lib/merch/catalogue";
import type { CuratedProduct } from "@/lib/merch/types";
import { getCatalogProduct } from "@/lib/printful/catalogue";
import { getPrintfulClientOrNull } from "@/lib/printful/client";

/**
 * Data for the product-builder wizard (ADR-024, spec §12). Pairs each enabled
 * curated product with a REPRESENTATIVE Printful unit cost (the max wholesale
 * cost across its allowed variants — conservative, so the previewed creator
 * profit is a worst case, never overstated). Fails safe: if Printful is
 * unavailable the cost is null and the wizard shows the price step without a
 * live profit preview (the authoritative estimate is computed at create time).
 */

export interface WizardCuratedProduct extends CuratedProduct {
  /** Representative Printful unit cost, minor units, in `currency`; null if unknown. */
  printfulUnitCostMinor: number | null;
}

/** The max Printful wholesale cost across a curated product's allowed variants. */
export const resolveRepresentativeUnitCost = cache(
  async (printfulProductId: number, allowedVariantIds: number[]): Promise<number | null> => {
    const client = getPrintfulClientOrNull();
    if (!client || allowedVariantIds.length === 0) {
      return null;
    }
    try {
      const detail = await getCatalogProduct(client, printfulProductId);
      const allowed = new Set(allowedVariantIds);
      const costs = detail.variants
        .filter((v) => allowed.has(v.id))
        .map((v) => v.priceMinor);
      return costs.length > 0 ? Math.max(...costs) : null;
    } catch {
      return null;
    }
  },
);

export async function getCuratedProductsForWizard(): Promise<WizardCuratedProduct[]> {
  const curated = await getEnabledCuratedProducts();
  return Promise.all(
    curated.map(async (product) => ({
      ...product,
      printfulUnitCostMinor: await resolveRepresentativeUnitCost(
        product.printfulCatalogProductId,
        product.allowedVariantIds,
      ),
    })),
  );
}
