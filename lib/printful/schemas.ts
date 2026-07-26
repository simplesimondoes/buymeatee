/**
 * Runtime validation + normalisation of Printful API responses (ADR-024).
 *
 * The project deliberately hand-rolls runtime validation rather than adding a
 * schema library (see lib/profile/avatar.ts, lib/payments). These parsers take
 * `unknown` (parsed JSON) and return a typed domain object, throwing
 * PrintfulValidationError on any mismatch — so a shape change upstream fails
 * loudly and safely instead of corrupting an order. Printful's decimal price
 * strings are converted to integer MINOR units with string arithmetic; no
 * floating-point money maths ever.
 */

import { PrintfulError } from "@/lib/printful/errors";
import type {
  PrintfulCatalogListItem,
  PrintfulCatalogVariant,
  PrintfulFile,
  PrintfulMockupResult,
  PrintfulMockupTask,
  PrintfulMockupTaskStatus,
  PrintfulOrder,
  PrintfulOrderCosts,
  PrintfulOrderShipment,
  PrintfulProductDetail,
  PrintfulShippingRate,
} from "@/lib/printful/types";

function fail(message: string): never {
  throw new PrintfulError("validation", `Printful response invalid: ${message}`);
}

function asRecord(value: unknown, ctx: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(`${ctx} is not an object`);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, ctx: string): unknown[] {
  if (!Array.isArray(value)) {
    fail(`${ctx} is not an array`);
  }
  return value;
}

function asNumber(value: unknown, ctx: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(`${ctx} is not a number`);
  }
  return value;
}

function asString(value: unknown, ctx: string): string {
  if (typeof value !== "string") {
    fail(`${ctx} is not a string`);
  }
  return value;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

/**
 * Convert a Printful major-unit price string (e.g. "18.00", "5", "12.5") into
 * integer minor units for a 2-decimal currency, using string arithmetic. All
 * BuyMeATee-supported settlement currencies are 2-decimal (JPY/KRW are
 * excluded platform-wide), so a fixed exponent of 2 is correct here.
 */
export function parseMajorDecimalToMinor(value: unknown, ctx: string): number {
  const raw =
    typeof value === "number" ? value.toString() : asString(value, ctx).trim();
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(raw);
  if (!match) {
    fail(`${ctx} is not a 2-decimal money string ("${raw}")`);
  }
  const sign = match[1] === "-" ? -1 : 1;
  const whole = Number.parseInt(match[2], 10);
  const fraction = Number.parseInt((match[3] ?? "").padEnd(2, "0"), 10);
  return sign * (whole * 100 + fraction);
}

export function parseCatalogProductDetail(result: unknown): PrintfulProductDetail {
  const record = asRecord(result, "product detail");
  const product = asRecord(record.product, "product");
  // Printful returns catalogue prices in the account/store currency at the
  // PRODUCT level; individual variants carry no currency field. Use the
  // product currency for every variant (validated against the live API).
  const productCurrency = optionalString(product.currency) ?? "USD";
  const variants = asArray(record.variants, "variants").map(
    (v): PrintfulCatalogVariant => {
      const variant = asRecord(v, "variant");
      return {
        id: asNumber(variant.id, "variant.id"),
        productId: asNumber(variant.product_id, "variant.product_id"),
        name: asString(variant.name, "variant.name"),
        size: optionalString(variant.size),
        color: optionalString(variant.color),
        colorCode: optionalString(variant.color_code),
        priceMinor: parseMajorDecimalToMinor(variant.price, "variant.price"),
        currency: (optionalString(variant.currency) ?? productCurrency).toLowerCase(),
        inStock: asBoolean(variant.in_stock),
      };
    },
  );
  return {
    product: {
      id: asNumber(product.id, "product.id"),
      type: asString(product.type ?? "", "product.type"),
      brand: optionalString(product.brand),
      model: asString(product.model ?? "", "product.model"),
      title: asString(product.title ?? "", "product.title"),
      description: asString(product.description ?? "", "product.description"),
    },
    variants,
  };
}

/** Parse the catalogue product LIST (GET /products) for admin search. */
export function parseCatalogProductList(result: unknown): PrintfulCatalogListItem[] {
  return asArray(result, "product list").map((p): PrintfulCatalogListItem => {
    const item = asRecord(p, "product");
    return {
      id: asNumber(item.id, "product.id"),
      title: asString(item.title ?? "", "product.title"),
      type: asString(item.type ?? "", "product.type"),
      typeName: optionalString(item.type_name) ?? "",
      brand: optionalString(item.brand),
      imageUrl: optionalString(item.image),
      variantCount: typeof item.variant_count === "number" ? item.variant_count : 0,
    };
  });
}

export function parseFile(result: unknown): PrintfulFile {
  const record = asRecord(result, "file");
  return {
    id: asNumber(record.id, "file.id"),
    hash: optionalString(record.hash),
    url: optionalString(record.url),
    filename: optionalString(record.filename),
    mimeType: optionalString(record.mime_type),
    status: optionalString(record.status),
  };
}

function parseMockupStatus(value: unknown): PrintfulMockupTaskStatus {
  const status = optionalString(value);
  if (status === "completed" || status === "failed") {
    return status;
  }
  return "pending";
}

export function parseMockupTask(result: unknown): PrintfulMockupTask {
  const record = asRecord(result, "mockup task");
  const status = parseMockupStatus(record.status);
  const mockups: PrintfulMockupResult[] = Array.isArray(record.mockups)
    ? record.mockups.map((m): PrintfulMockupResult => {
        const mockup = asRecord(m, "mockup");
        return {
          variantIds: Array.isArray(mockup.variant_ids)
            ? mockup.variant_ids.map((id) => asNumber(id, "mockup.variant_id"))
            : [],
          placement: asString(mockup.placement ?? "", "mockup.placement"),
          mockupUrl: asString(mockup.mockup_url, "mockup.mockup_url"),
        };
      })
    : [];
  return {
    taskKey: asString(record.task_key, "task_key"),
    status,
    mockups,
    error: optionalString(record.error) ?? undefined,
  };
}

export function parseShippingRates(result: unknown): PrintfulShippingRate[] {
  return asArray(result, "shipping rates").map((r): PrintfulShippingRate => {
    const rate = asRecord(r, "rate");
    return {
      id: asString(rate.id, "rate.id"),
      name: asString(rate.name ?? "", "rate.name"),
      rateMinor: parseMajorDecimalToMinor(rate.rate, "rate.rate"),
      currency: asString(rate.currency ?? "USD", "rate.currency"),
      minDeliveryDays:
        typeof rate.minDeliveryDays === "number"
          ? rate.minDeliveryDays
          : undefined,
      maxDeliveryDays:
        typeof rate.maxDeliveryDays === "number"
          ? rate.maxDeliveryDays
          : undefined,
    };
  });
}

function parseCosts(value: unknown): PrintfulOrderCosts | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  return {
    currency: asString(record.currency ?? "USD", "costs.currency"),
    subtotalMinor: parseMajorDecimalToMinor(record.subtotal ?? "0", "costs.subtotal"),
    shippingMinor: parseMajorDecimalToMinor(record.shipping ?? "0", "costs.shipping"),
    taxMinor: parseMajorDecimalToMinor(record.tax ?? "0", "costs.tax"),
    totalMinor: parseMajorDecimalToMinor(record.total ?? "0", "costs.total"),
  };
}

function parseShipments(value: unknown): PrintfulOrderShipment[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((s): PrintfulOrderShipment => {
    const shipment = asRecord(s, "shipment");
    return {
      id: (shipment.id as number | string) ?? "",
      carrier: optionalString(shipment.carrier),
      service: optionalString(shipment.service),
      trackingNumber: optionalString(shipment.tracking_number),
      trackingUrl: optionalString(shipment.tracking_url),
      shipDate: optionalString(shipment.ship_date),
    };
  });
}

export function parseOrder(result: unknown): PrintfulOrder {
  const record = asRecord(result, "order");
  return {
    id: asNumber(record.id, "order.id"),
    externalId: optionalString(record.external_id),
    status: asString(record.status, "order.status"),
    shipping: optionalString(record.shipping),
    costs: parseCosts(record.costs),
    shipments: parseShipments(record.shipments),
  };
}
