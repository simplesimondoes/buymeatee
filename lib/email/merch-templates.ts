import { createTranslator } from "next-intl";

import { enMessages } from "@/i18n/en";
import { loadMessages } from "@/i18n/load-messages";
import { defaultLocale, htmlLang, type AppLocale } from "@/i18n/locales";
import {
  escapeHtml,
  renderEmailLayout,
  renderTextEmail,
} from "@/lib/email/layout";
import { formatMinorAmount } from "@/lib/i18n/format";
import type { SupportedCurrency } from "@/lib/payments/currency";
import { siteConfig } from "@/lib/site";

/**
 * Merchandise email templates (ADR-024, spec §28). Pure builders returning
 * subject + HTML + text, localised in the recipient's language (English
 * fallback via the deep-merge). Customer emails NEVER show the Printful
 * wholesale cost; creator emails show only the creator's own profit. All
 * user/product content is escaped in HTML.
 */

export type RenderedEmail = { subject: string; html: string; text: string };

type EmailTranslator = ReturnType<
  typeof createTranslator<typeof enMessages, "emails">
>;

async function t(locale: AppLocale): Promise<EmailTranslator> {
  const messages = await loadMessages(locale);
  return createTranslator({ locale, messages, namespace: "emails" });
}

function paragraph(html: string): string {
  return `<p style="margin:0 0 14px;">${html}</p>`;
}
function strong(value: string): string {
  return `<strong>${escapeHtml(value)}</strong>`;
}

/** Customer: their merch order was paid and is going into production. */
export async function renderMerchOrderConfirmationEmail(input: {
  publicReference: string;
  total: number;
  currency: SupportedCurrency;
  locale?: AppLocale;
}): Promise<RenderedEmail> {
  const locale = input.locale ?? defaultLocale;
  const tr = await t(locale);
  const total = formatMinorAmount(input.total, input.currency, locale);
  const ref = input.publicReference;

  const bodyHtml = [
    paragraph(escapeHtml(tr("merchOrderConfirmation.intro"))),
    paragraph(
      `${tr("merchOrderConfirmation.orderRefLabel")}: ${strong(ref)}<br>` +
        `${tr("merchOrderConfirmation.totalLabel")}: ${strong(total)}`,
    ),
    paragraph(escapeHtml(tr("merchOrderConfirmation.productionNotice"))),
    paragraph(escapeHtml(tr("merchOrderConfirmation.deliveryNotice"))),
  ].join("");

  const textLines = [
    tr("merchOrderConfirmation.intro"),
    "",
    `${tr("merchOrderConfirmation.orderRefLabel")}: ${ref}`,
    `${tr("merchOrderConfirmation.totalLabel")}: ${total}`,
    "",
    tr("merchOrderConfirmation.productionNotice"),
    tr("merchOrderConfirmation.deliveryNotice"),
  ];
  const tagline = tr("layout.tagline");
  return {
    subject: tr("merchOrderConfirmation.subject", { ref }),
    html: renderEmailLayout({
      preheader: tr("merchOrderConfirmation.preheader", { ref }),
      heading: tr("merchOrderConfirmation.heading"),
      bodyHtml,
      lang: htmlLang[locale],
      tagline,
    }),
    text: renderTextEmail(textLines, undefined, tagline),
  };
}

/** Customer: their order (or part of it) has shipped, with tracking. */
export async function renderMerchOrderShippedEmail(input: {
  publicReference: string;
  carrier?: string | null;
  trackingUrl?: string | null;
  locale?: AppLocale;
}): Promise<RenderedEmail> {
  const locale = input.locale ?? defaultLocale;
  const tr = await t(locale);
  const ref = input.publicReference;
  const carrier = input.carrier?.trim() || null;

  const bodyHtml = [
    paragraph(tr("merchOrderShipped.intro", { ref: strong(ref) })),
    carrier
      ? paragraph(`${tr("merchOrderShipped.carrierLabel")}: ${strong(carrier)}`)
      : "",
    paragraph(escapeHtml(tr("merchOrderShipped.deliveryNotice"))),
  ].join("");

  const textLines = [tr("merchOrderShipped.intro", { ref })];
  if (carrier) {
    textLines.push(`${tr("merchOrderShipped.carrierLabel")}: ${carrier}`);
  }
  textLines.push("", tr("merchOrderShipped.deliveryNotice"));

  const cta = input.trackingUrl
    ? { label: tr("merchOrderShipped.trackingCta"), url: input.trackingUrl }
    : undefined;
  const tagline = tr("layout.tagline");
  return {
    subject: tr("merchOrderShipped.subject", { ref }),
    html: renderEmailLayout({
      preheader: tr("merchOrderShipped.preheader", { ref }),
      heading: tr("merchOrderShipped.heading"),
      bodyHtml,
      cta,
      lang: htmlLang[locale],
      tagline,
    }),
    text: renderTextEmail(textLines, cta, tagline),
  };
}

/** Creator: a merch sale was recorded; their profit transfers once it ships. */
export async function renderMerchSaleRecordedEmail(input: {
  productTitle: string;
  profit: number;
  currency: SupportedCurrency;
  locale?: AppLocale;
}): Promise<RenderedEmail> {
  const locale = input.locale ?? defaultLocale;
  const tr = await t(locale);
  const profit = formatMinorAmount(input.profit, input.currency, locale);
  const product = input.productTitle || tr("merchSaleRecorded.fallbackProduct");
  const dashboardUrl = `${siteConfig.url}/${locale}/dashboard/merch`;

  const bodyHtml = [
    paragraph(
      tr("merchSaleRecorded.body", {
        product: strong(product),
        profit: strong(profit),
      }),
    ),
    paragraph(escapeHtml(tr("merchSaleRecorded.transferNote"))),
  ].join("");

  const textLines = [
    tr("merchSaleRecorded.body", { product, profit }),
    "",
    tr("merchSaleRecorded.transferNote"),
  ];
  const cta = { label: tr("merchSaleRecorded.cta"), url: dashboardUrl };
  const tagline = tr("layout.tagline");
  return {
    subject: tr("merchSaleRecorded.subject"),
    html: renderEmailLayout({
      preheader: tr("merchSaleRecorded.preheader", { product }),
      heading: tr("merchSaleRecorded.heading"),
      bodyHtml,
      cta,
      lang: htmlLang[locale],
      tagline,
    }),
    text: renderTextEmail(textLines, cta, tagline),
  };
}
