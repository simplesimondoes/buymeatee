import "server-only";

import { isEmailConfigured } from "@/lib/email/config";
import { logEmailEvent } from "@/lib/email/log";
import { sendEmail, type EmailOutcome } from "@/lib/email/send";
import { renderGiftReceiptEmail } from "@/lib/email/templates";
import type { SupportedCurrency } from "@/lib/payments/currency";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Direct (non-queued) email sends (ADR-013).
 *
 * The gift RECEIPT does NOT go through the gift_notifications queue: it is
 * addressed to the Supporter, who may be anonymous and has no profile row (the
 * queue is keyed on a Creator profile), and whose email must never sit in a
 * Creator-readable payload.
 *
 * It is best-effort: it never throws, so a delivery problem can't fail the
 * webhook that triggered it.
 */

/** Receipt / thank-you to the Supporter who bought the tee. */
export async function sendGiftReceipt(input: {
  creatorUserId: string;
  amount: number;
  currency: SupportedCurrency;
  toEmail: string;
}): Promise<EmailOutcome> {
  if (!isEmailConfigured()) {
    return "not-configured";
  }

  let creatorName = "a creator";
  try {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", input.creatorUserId)
      .maybeSingle();
    creatorName =
      (data?.display_name as string) ||
      (data?.username as string) ||
      "a creator";
  } catch (cause) {
    // Fall back to the generic name — a lookup failure must not block the receipt.
    logEmailEvent("warn", "notify.receipt_name_lookup_failed", {
      reason: cause instanceof Error ? cause.message : "unknown",
    });
  }

  const email = renderGiftReceiptEmail({
    creatorName,
    amount: input.amount,
    currency: input.currency,
  });
  return sendEmail({
    to: input.toEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
    kind: "gift_receipt",
  });
}
