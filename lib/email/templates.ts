import { formatMinorAmount, type SupportedCurrency } from "@/lib/payments/currency";
import {
  escapeHtml,
  renderEmailLayout,
  renderTextEmail,
} from "@/lib/email/layout";
import { siteConfig } from "@/lib/site";

/**
 * Platform email templates (ADR-013). Pure builders returning the subject
 * and both HTML + plain-text bodies. Product vocabulary is deliberate:
 * Creator, Supporter, Goal, tee, journey — never "donation" or "recipient".
 */

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

function paragraph(html: string): string {
  return `<p style="margin:0 0 14px;">${html}</p>`;
}

/**
 * A Supporter bought a Creator a tee. Sent to the Creator. The sender name
 * has already had the anonymity choice applied upstream (it may be
 * "Anonymous"); an optional message is included verbatim but escaped.
 */
export function renderGiftReceivedEmail(input: {
  senderDisplayName: string;
  amount: number;
  currency: SupportedCurrency;
  message?: string | null;
}): RenderedEmail {
  const amount = formatMinorAmount(input.amount, input.currency);
  const sender = escapeHtml(input.senderDisplayName || "A supporter");
  const dashboardUrl = `${siteConfig.url}/dashboard`;

  const messageBlock =
    input.message && input.message.trim()
      ? `<blockquote style="margin:0 0 14px;padding:12px 16px;border-left:3px solid #bd9c5d;background-color:#f6f6f3;font-style:italic;">${escapeHtml(input.message.trim())}</blockquote>`
      : "";

  const bodyHtml = [
    paragraph(`<strong>${sender}</strong> just bought you a tee — <strong>${amount}</strong>.`),
    messageBlock,
    paragraph("Every tee is someone backing your journey. Nice work."),
  ].join("");

  const textLines = [
    `${input.senderDisplayName || "A supporter"} just bought you a tee — ${amount}.`,
  ];
  if (input.message && input.message.trim()) {
    textLines.push("", `"${input.message.trim()}"`);
  }
  textLines.push("", "Every tee is someone backing your journey. Nice work.");

  const cta = { label: "View your dashboard", url: dashboardUrl };
  return {
    subject: `You got a tee — ${amount} from ${input.senderDisplayName || "a supporter"}`,
    html: renderEmailLayout({
      preheader: `${sender} bought you a tee (${amount}).`,
      heading: "You got a tee ⛳",
      bodyHtml,
      cta,
    }),
    text: renderTextEmail(textLines, cta),
  };
}

/**
 * Receipt / thank-you sent to the Supporter who bought the tee. `creatorName`
 * is the public display name of the Creator they supported.
 */
export function renderGiftReceiptEmail(input: {
  creatorName: string;
  amount: number;
  currency: SupportedCurrency;
  /** The goal / wish-list item the tee went toward, if any. */
  targetTitle?: string | null;
}): RenderedEmail {
  const amount = formatMinorAmount(input.amount, input.currency);
  const creator = escapeHtml(input.creatorName || "a creator");
  const target = input.targetTitle?.trim() ? input.targetTitle.trim() : null;

  const bodyHtml = [
    paragraph(`Thanks for buying <strong>${creator}</strong> a tee.`),
    target
      ? paragraph(`You put it toward <strong>${escapeHtml(target)}</strong>.`)
      : "",
    paragraph(`Your support of <strong>${amount}</strong> is on its way to them — this email is your receipt.`),
    paragraph("You just helped keep a golf journey moving. That's the whole idea."),
  ].join("");

  const textLines = [
    `Thanks for buying ${input.creatorName || "a creator"} a tee.`,
  ];
  if (target) {
    textLines.push("", `You put it toward ${target}.`);
  }
  textLines.push(
    "",
    `Your support of ${amount} is on its way to them — this email is your receipt.`,
    "",
    "You just helped keep a golf journey moving. That's the whole idea.",
  );

  const cta = { label: "Discover more creators", url: siteConfig.url };
  return {
    subject: `Your receipt — ${amount} to ${input.creatorName || "a creator"}`,
    html: renderEmailLayout({
      preheader: `Receipt: you bought ${creator} a tee (${amount}).`,
      heading: "Thanks for the support",
      bodyHtml,
      cta,
    }),
    text: renderTextEmail(textLines, cta),
  };
}

/**
 * A Creator's Goal reached its target. Goals never auto-complete (ADR-011) —
 * this celebrates hitting the number and nudges the Creator to mark it
 * complete when they're ready.
 */
export function renderGoalReachedEmail(input: {
  goalTitle: string;
  raisedAmount: number;
  targetAmount: number;
  currency: SupportedCurrency;
}): RenderedEmail {
  const title = escapeHtml(input.goalTitle || "your goal");
  const raised = formatMinorAmount(input.raisedAmount, input.currency);
  const target = formatMinorAmount(input.targetAmount, input.currency);
  const dashboardUrl = `${siteConfig.url}/dashboard`;

  const bodyHtml = [
    paragraph(`Your goal <strong>${title}</strong> just hit its target.`),
    paragraph(`Raised so far: <strong>${raised}</strong> of ${target}.`),
    paragraph("Head to your dashboard to mark it complete and share the moment with the supporters who got you there."),
  ].join("");

  const textLines = [
    `Your goal "${input.goalTitle || "your goal"}" just hit its target.`,
    "",
    `Raised so far: ${raised} of ${target}.`,
    "",
    "Head to your dashboard to mark it complete and share the moment with the supporters who got you there.",
  ];

  const cta = { label: "View your goal", url: dashboardUrl };
  return {
    subject: `Goal reached: ${input.goalTitle || "your goal"} 🎉`,
    html: renderEmailLayout({
      preheader: `${title} reached its target (${raised}).`,
      heading: "Your goal hit its target 🎯",
      bodyHtml,
      cta,
    }),
    text: renderTextEmail(textLines, cta),
  };
}
