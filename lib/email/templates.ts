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
 * Platform email templates (ADR-013 + ADR-019). Pure builders returning the
 * subject and both HTML + plain-text bodies, rendered in the recipient's
 * locale (English fallback via the message deep-merge). Product vocabulary is
 * deliberate: Creator, Supporter, Goal, tee, journey — never "donation" or
 * "recipient". User-generated content (names, messages, titles) is never
 * translated and always escaped in HTML.
 */

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

type EmailTranslator = ReturnType<
  typeof createTranslator<typeof enMessages, "emails">
>;

async function getEmailTranslator(
  locale: AppLocale,
): Promise<EmailTranslator> {
  const messages = await loadMessages(locale);
  return createTranslator({ locale, messages, namespace: "emails" });
}

function paragraph(html: string): string {
  return `<p style="margin:0 0 14px;">${html}</p>`;
}

function strong(value: string): string {
  return `<strong>${escapeHtml(value)}</strong>`;
}

/**
 * A Supporter bought a Creator a tee. Sent to the Creator, in the Creator's
 * preferred language. The sender name has already had the anonymity choice
 * applied upstream (it may be "Anonymous"); an optional message is included
 * verbatim but escaped.
 */
export async function renderGiftReceivedEmail(input: {
  senderDisplayName: string;
  amount: number;
  currency: SupportedCurrency;
  message?: string | null;
  locale?: AppLocale;
}): Promise<RenderedEmail> {
  const locale = input.locale ?? defaultLocale;
  const t = await getEmailTranslator(locale);
  const amount = formatMinorAmount(input.amount, input.currency, locale);
  const sender =
    input.senderDisplayName || t("giftReceived.fallbackSender");
  const senderInline =
    input.senderDisplayName || t("giftReceived.fallbackSenderInline");
  const dashboardUrl = `${siteConfig.url}/${locale}/dashboard`;

  const messageBlock =
    input.message && input.message.trim()
      ? `<blockquote style="margin:0 0 14px;padding:12px 16px;border-left:3px solid #bd9c5d;background-color:#f6f6f3;font-style:italic;">${escapeHtml(input.message.trim())}</blockquote>`
      : "";

  const bodyHtml = [
    paragraph(
      t("giftReceived.body", { sender: strong(sender), amount: strong(amount) }),
    ),
    messageBlock,
    paragraph(escapeHtml(t("giftReceived.encouragement"))),
  ].join("");

  const textLines = [t("giftReceived.body", { sender, amount })];
  if (input.message && input.message.trim()) {
    textLines.push("", `"${input.message.trim()}"`);
  }
  textLines.push("", t("giftReceived.encouragement"));

  const cta = { label: t("giftReceived.cta"), url: dashboardUrl };
  const tagline = t("layout.tagline");
  return {
    subject: t("giftReceived.subject", { amount, sender: senderInline }),
    html: renderEmailLayout({
      preheader: t("giftReceived.preheader", { sender, amount }),
      heading: t("giftReceived.heading"),
      bodyHtml,
      cta,
      lang: htmlLang[locale],
      tagline,
    }),
    text: renderTextEmail(textLines, cta, tagline),
  };
}

/**
 * Receipt / thank-you sent to the Supporter who bought the tee, in the
 * language they used at checkout (gifts.locale). `creatorName` is the public
 * display name of the Creator they supported.
 */
export async function renderGiftReceiptEmail(input: {
  creatorName: string;
  amount: number;
  currency: SupportedCurrency;
  /** The goal / wish-list item the tee went toward, if any. */
  targetTitle?: string | null;
  locale?: AppLocale;
}): Promise<RenderedEmail> {
  const locale = input.locale ?? defaultLocale;
  const t = await getEmailTranslator(locale);
  const amount = formatMinorAmount(input.amount, input.currency, locale);
  const creator = input.creatorName || t("giftReceipt.fallbackCreator");
  const target = input.targetTitle?.trim() ? input.targetTitle.trim() : null;

  const bodyHtml = [
    paragraph(t("giftReceipt.thanks", { creator: strong(creator) })),
    target
      ? paragraph(t("giftReceipt.target", { target: strong(target) }))
      : "",
    paragraph(t("giftReceipt.receipt", { amount: strong(amount) })),
    paragraph(escapeHtml(t("giftReceipt.closing"))),
  ].join("");

  const textLines = [t("giftReceipt.thanks", { creator })];
  if (target) {
    textLines.push("", t("giftReceipt.target", { target }));
  }
  textLines.push(
    "",
    t("giftReceipt.receipt", { amount }),
    "",
    t("giftReceipt.closing"),
  );

  const cta = {
    label: t("giftReceipt.cta"),
    url: `${siteConfig.url}/${locale}/discover`,
  };
  const tagline = t("layout.tagline");
  return {
    subject: t("giftReceipt.subject", { amount, creator }),
    html: renderEmailLayout({
      preheader: t("giftReceipt.preheader", { creator, amount }),
      heading: t("giftReceipt.heading"),
      bodyHtml,
      cta,
      lang: htmlLang[locale],
      tagline,
    }),
    text: renderTextEmail(textLines, cta, tagline),
  };
}

/**
 * A Creator's Goal reached its target, told in the Creator's language. Goals
 * never auto-complete (ADR-011) — this celebrates hitting the number and
 * nudges the Creator to mark it complete when they're ready.
 */
export async function renderGoalReachedEmail(input: {
  goalTitle: string;
  raisedAmount: number;
  targetAmount: number;
  currency: SupportedCurrency;
  locale?: AppLocale;
}): Promise<RenderedEmail> {
  const locale = input.locale ?? defaultLocale;
  const t = await getEmailTranslator(locale);
  const title = input.goalTitle || t("goalReached.fallbackTitle");
  const raised = formatMinorAmount(input.raisedAmount, input.currency, locale);
  const target = formatMinorAmount(input.targetAmount, input.currency, locale);
  const dashboardUrl = `${siteConfig.url}/${locale}/dashboard`;

  const bodyHtml = [
    paragraph(t("goalReached.body", { title: strong(title) })),
    paragraph(
      t("goalReached.progress", { raised: strong(raised), target: escapeHtml(target) }),
    ),
    paragraph(escapeHtml(t("goalReached.nextStep"))),
  ].join("");

  const textLines = [
    t("goalReached.body", { title: `"${title}"` }),
    "",
    t("goalReached.progress", { raised, target }),
    "",
    t("goalReached.nextStep"),
  ];

  const cta = { label: t("goalReached.cta"), url: dashboardUrl };
  const tagline = t("layout.tagline");
  return {
    subject: t("goalReached.subject", { title }),
    html: renderEmailLayout({
      preheader: t("goalReached.preheader", { title, raised }),
      heading: t("goalReached.heading"),
      bodyHtml,
      cta,
      lang: htmlLang[locale],
      tagline,
    }),
    text: renderTextEmail(textLines, cta, tagline),
  };
}
