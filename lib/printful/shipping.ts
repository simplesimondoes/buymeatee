import "server-only";

import type { PrintfulClient } from "@/lib/printful/client";
import { parseShippingRates } from "@/lib/printful/schemas";
import type {
  PrintfulRecipient,
  PrintfulShippingRate,
} from "@/lib/printful/types";

/**
 * Printful live shipping rates (ADR-024, spec §22). Rates depend on the
 * destination address, variants and quantity. Returned rates are normalised to
 * integer minor units. Delivery estimates are RANGES, never guarantees.
 */

export interface ShippingRateItem {
  variantId: number;
  quantity: number;
}

export function calculateShippingRates(
  client: PrintfulClient,
  input: {
    recipient: Pick<
      PrintfulRecipient,
      "countryCode" | "stateCode" | "zip" | "city" | "address1"
    >;
    items: ShippingRateItem[];
    currency: string;
  },
): Promise<PrintfulShippingRate[]> {
  return client.request({
    method: "POST",
    path: "/shipping/rates",
    body: {
      recipient: {
        country_code: input.recipient.countryCode,
        state_code: input.recipient.stateCode,
        zip: input.recipient.zip,
        city: input.recipient.city,
        address1: input.recipient.address1,
      },
      items: input.items.map((i) => ({
        variant_id: i.variantId,
        quantity: i.quantity,
      })),
      currency: input.currency.toUpperCase(),
    },
    parse: parseShippingRates,
    // Rate quotes are read-only and safe to retry.
    retry: true,
  });
}
