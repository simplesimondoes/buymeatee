import "server-only";

import type { AppLocale } from "@/i18n/locales";
import { isEmailConfigured } from "@/lib/email/config";
import {
  renderMerchOrderConfirmationEmail,
  renderMerchOrderShippedEmail,
  renderMerchSaleRecordedEmail,
} from "@/lib/email/merch-templates";
import { sendEmail, type EmailOutcome } from "@/lib/email/send";
import { getUserEmail, getUserEmailLocale } from "@/lib/email/user-email";
import type { SupportedCurrency } from "@/lib/payments/currency";

/**
 * Direct (non-queued) merch email sends (ADR-024, spec §28). All best-effort —
 * they never throw, so a delivery problem can't fail the webhook / fulfilment
 * path that triggered them. Customer emails never include the Printful cost.
 */

/** Customer: order paid and going into production. */
export async function sendMerchOrderConfirmation(input: {
  toEmail: string | null;
  publicReference: string;
  total: number;
  currency: SupportedCurrency;
  locale?: AppLocale;
}): Promise<EmailOutcome> {
  if (!isEmailConfigured() || !input.toEmail) {
    return "not-configured";
  }
  const email = await renderMerchOrderConfirmationEmail({
    publicReference: input.publicReference,
    total: input.total,
    currency: input.currency,
    locale: input.locale,
  });
  return sendEmail({
    to: input.toEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
    kind: "merch_order_confirmation",
  });
}

/** Customer: their order shipped, with tracking when available. */
export async function sendMerchOrderShipped(input: {
  toEmail: string | null;
  publicReference: string;
  carrier?: string | null;
  trackingUrl?: string | null;
  locale?: AppLocale;
}): Promise<EmailOutcome> {
  if (!isEmailConfigured() || !input.toEmail) {
    return "not-configured";
  }
  const email = await renderMerchOrderShippedEmail({
    publicReference: input.publicReference,
    carrier: input.carrier,
    trackingUrl: input.trackingUrl,
    locale: input.locale,
  });
  return sendEmail({
    to: input.toEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
    kind: "merch_order_shipped",
  });
}

/** Creator: a sale was recorded; resolves the creator's email + locale. */
export async function sendMerchSaleRecorded(input: {
  creatorUserId: string;
  productTitle: string;
  profit: number;
  currency: SupportedCurrency;
}): Promise<EmailOutcome> {
  if (!isEmailConfigured()) {
    return "not-configured";
  }
  const [toEmail, locale] = await Promise.all([
    getUserEmail(input.creatorUserId),
    getUserEmailLocale(input.creatorUserId),
  ]);
  if (!toEmail) {
    return "not-configured";
  }
  const email = await renderMerchSaleRecordedEmail({
    productTitle: input.productTitle,
    profit: input.profit,
    currency: input.currency,
    locale,
  });
  return sendEmail({
    to: toEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
    kind: "merch_sale_recorded",
  });
}
