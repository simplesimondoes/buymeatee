import type { SupportedCurrency } from "@/lib/payments/currency";

/**
 * Merchandise domain types (Printful merch MVP, ADR-024). Mirror the enums and
 * row shapes in supabase/migrations/20260725190000_merch_shops.sql. Pure module.
 */

export type MerchShopStatus = "draft" | "open" | "paused" | "closed";

export type MerchProductStatus =
  | "draft"
  | "awaiting_approval"
  | "changes_requested"
  | "approved"
  | "published"
  | "paused"
  | "archived";

export type MerchMockupStatus = "none" | "processing" | "ready" | "failed";

export type MerchModerationStatus =
  | "pending"
  | "approved"
  | "changes_requested"
  | "rejected";

export type MerchOrderStatus =
  | "draft"
  | "awaiting_payment"
  | "payment_processing"
  | "paid"
  | "printful_submission_pending"
  | "printful_draft_created"
  | "printful_confirmed"
  | "in_production"
  | "partially_shipped"
  | "shipped"
  | "delivered"
  | "on_hold"
  | "failed"
  | "cancelled"
  | "refund_pending"
  | "partially_refunded"
  | "refunded"
  | "disputed";

export type MerchTransferStatus =
  | "none"
  | "pending"
  | "transferred"
  | "transfer_failed"
  | "reversed"
  | "held";

export type MerchPaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "disputed";

export type MerchFulfilmentStatus =
  | "not_submitted"
  | "submitted"
  | "confirmed"
  | "in_production"
  | "partially_shipped"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "on_hold"
  | "failed";

export type MerchRefundStatus =
  | "none"
  | "refund_pending"
  | "partially_refunded"
  | "refunded";

/** Moderation reason codes (spec §24). */
export type MerchModerationReason =
  | "copyright_or_trademark"
  | "offensive_content"
  | "misleading_content"
  | "poor_print_quality"
  | "invalid_artwork"
  | "unsupported_product"
  | "pricing_issue"
  | "creator_account_issue"
  | "other";

/** Refund reason codes (spec §26). */
export type MerchRefundReason =
  | "customer_requested"
  | "address_problem"
  | "printful_failure"
  | "damaged_product"
  | "lost_shipment"
  | "wrong_item"
  | "duplicate_order"
  | "fraud"
  | "admin_goodwill"
  | "other";

export interface CuratedProduct {
  id: string;
  printfulCatalogProductId: number;
  slug: string;
  displayName: string;
  description: string | null;
  category: string | null;
  enabled: boolean;
  featured: boolean;
  sortOrder: number;
  allowedVariantIds: number[];
  allowedColours: string[];
  allowedSizes: string[];
  allowedPlacements: string[];
  defaultPlacement: string | null;
  supportedRegions: string[];
  currency: SupportedCurrency;
  minimumRetailPriceMinor: number;
  minimumCreatorProfitMinor: number;
}

export interface MerchShopSettings {
  creatorId: string;
  shopTitle: string | null;
  shopDescription: string | null;
  shopStatus: MerchShopStatus;
  defaultCurrency: SupportedCurrency | null;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  betaAccess: boolean;
}

/** The current terms version creators must accept before publishing. */
export const MERCH_TERMS_VERSION = "2026-07-merch-terms-v1";
