/**
 * Printful API v1 domain types (Printful merch MVP, ADR-024).
 *
 * Only the fields BuyMeATee actually consumes are modelled; Printful responses
 * carry much more. Pure module. All money that BuyMeATee stores is converted to
 * integer minor units at the boundary — Printful returns decimal-string prices,
 * which never enter the app as floats beyond the parse step in schemas.ts.
 */

/** Every Printful v1 response is wrapped in this envelope. */
export interface PrintfulEnvelope<T> {
  code: number;
  result: T;
  error?: { reason?: string; message?: string };
}

// --- Catalogue -------------------------------------------------------------

export interface PrintfulCatalogProduct {
  id: number;
  type: string;
  brand: string | null;
  model: string;
  title: string;
  description: string;
}

export interface PrintfulCatalogVariant {
  id: number;
  productId: number;
  name: string;
  size: string | null;
  color: string | null;
  /** Wholesale price in MINOR units of `currency`, parsed from the API string. */
  priceMinor: number;
  currency: string;
  inStock: boolean;
}

export interface PrintfulProductDetail {
  product: PrintfulCatalogProduct;
  variants: PrintfulCatalogVariant[];
}

/** A row from the catalogue product LIST (GET /products) — for admin search. */
export interface PrintfulCatalogListItem {
  id: number;
  title: string;
  type: string;
  typeName: string;
  brand: string | null;
  imageUrl: string | null;
  variantCount: number;
}

// --- Files -----------------------------------------------------------------

export interface PrintfulFile {
  id: number;
  hash: string | null;
  url: string | null;
  filename: string | null;
  mimeType: string | null;
  status: string | null;
}

// --- Mockups ---------------------------------------------------------------

export type PrintfulMockupTaskStatus = "pending" | "completed" | "failed";

export interface PrintfulMockupResult {
  variantIds: number[];
  placement: string;
  /** Rendered mockup image URL (hosted by Printful; time-limited). */
  mockupUrl: string;
}

export interface PrintfulMockupTask {
  taskKey: string;
  status: PrintfulMockupTaskStatus;
  mockups: PrintfulMockupResult[];
  error?: string;
}

// --- Shipping --------------------------------------------------------------

export interface PrintfulShippingRate {
  id: string;
  name: string;
  /** Rate in MINOR units of `currency`. */
  rateMinor: number;
  currency: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
}

// --- Orders ----------------------------------------------------------------

export interface PrintfulRecipient {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  stateCode?: string;
  countryCode: string;
  zip: string;
  email?: string;
  phone?: string;
}

export interface PrintfulOrderItemInput {
  /** Printful catalog variant id. */
  variantId: number;
  quantity: number;
  /** Retail price shown on the packing slip, major-unit decimal string. */
  retailPrice?: string;
  /** Print files by placement, e.g. { type: "front", url: "https://…" }. */
  files: Array<{ type?: string; url: string }>;
  name?: string;
}

export interface PrintfulOrderCosts {
  currency: string;
  /** All in MINOR units, parsed from Printful's decimal strings. */
  subtotalMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export interface PrintfulOrderShipment {
  id: number | string;
  carrier: string | null;
  service: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shipDate: string | null;
}

export interface PrintfulOrder {
  id: number;
  externalId: string | null;
  status: string;
  shipping: string | null;
  costs?: PrintfulOrderCosts;
  shipments: PrintfulOrderShipment[];
}
