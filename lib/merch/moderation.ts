import "server-only";

import type {
  MerchModerationReason,
  MerchModerationStatus,
  MerchProductStatus,
} from "@/lib/merch/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Merchandise moderation (ADR-024, spec §24). All products require admin
 * approval before publication. Moderation columns are service-role only, so
 * these run on the admin client behind the owner/admin gate at the route.
 */

export interface PendingProduct {
  id: string;
  creatorId: string;
  title: string;
  currency: string;
  retailPriceMinor: number;
  estimatedCreatorProfitMinor: number | null;
  submittedForReviewAt: string | null;
  moderationStatus: MerchModerationStatus;
  moderationNotes: string | null;
}

const PENDING_COLUMNS =
  "id, creator_id, title, currency, retail_price_minor, estimated_creator_profit_minor, submitted_for_review_at, moderation_status, moderation_notes";

export async function listPendingProducts(): Promise<PendingProduct[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("merch_products")
    .select(PENDING_COLUMNS)
    .eq("moderation_status", "pending")
    .eq("status", "awaiting_approval")
    .order("submitted_for_review_at", { ascending: true });
  if (error) {
    return [];
  }
  return (
    (data as Array<{
      id: string;
      creator_id: string;
      title: string;
      currency: string;
      retail_price_minor: number;
      estimated_creator_profit_minor: number | null;
      submitted_for_review_at: string | null;
      moderation_status: MerchModerationStatus;
      moderation_notes: string | null;
    }> | null) ?? []
  ).map((r) => ({
    id: r.id,
    creatorId: r.creator_id,
    title: r.title,
    currency: r.currency,
    retailPriceMinor: r.retail_price_minor,
    estimatedCreatorProfitMinor: r.estimated_creator_profit_minor,
    submittedForReviewAt: r.submitted_for_review_at,
    moderationStatus: r.moderation_status,
    moderationNotes: r.moderation_notes,
  }));
}

export type ModerationDecision = "approve" | "request_changes" | "reject";

export type ModerationResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "reason_required" | "unavailable" };

/**
 * Apply a moderation decision (spec §24). `approve` moves the product to
 * `approved` (the creator can then publish it). `request_changes`/`reject`
 * require a reason and send the product back to the creator / archive it.
 */
export async function moderateProduct(
  adminId: string,
  productId: string,
  decision: ModerationDecision,
  reason?: MerchModerationReason,
  notes?: string,
): Promise<ModerationResult> {
  if (decision !== "approve" && !reason) {
    return { ok: false, error: "reason_required" };
  }
  const supabase = getSupabaseAdminClient();

  let moderationStatus: MerchModerationStatus;
  let status: MerchProductStatus;
  if (decision === "approve") {
    moderationStatus = "approved";
    status = "approved";
  } else if (decision === "request_changes") {
    moderationStatus = "changes_requested";
    status = "changes_requested";
  } else {
    moderationStatus = "rejected";
    status = "archived";
  }

  const update: Record<string, unknown> = {
    moderation_status: moderationStatus,
    status,
    moderation_notes:
      decision === "approve" ? null : [reason, notes].filter(Boolean).join(": "),
  };
  if (decision === "approve") {
    update.approved_at = new Date().toISOString();
    update.approved_by = adminId;
  }

  const { data, error } = await supabase
    .from("merch_products")
    .update(update)
    // Only products actually awaiting review can be moderated.
    .eq("id", productId)
    .eq("moderation_status", "pending")
    .select("id")
    .maybeSingle();
  if (error) {
    return { ok: false, error: "unavailable" };
  }
  if (!data) {
    return { ok: false, error: "not_found" };
  }
  return { ok: true };
}
