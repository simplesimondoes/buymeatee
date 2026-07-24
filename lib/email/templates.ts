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
}): RenderedEmail {
  const amount = formatMinorAmount(input.amount, input.currency);
  const creator = escapeHtml(input.creatorName || "a creator");

  const bodyHtml = [
    paragraph(`Thanks for buying <strong>${creator}</strong> a tee.`),
    paragraph(`Your support of <strong>${amount}</strong> is on its way to them — this email is your receipt.`),
    paragraph("You just helped keep a golf journey moving. That's the whole idea."),
  ].join("");

  const textLines = [
    `Thanks for buying ${input.creatorName || "a creator"} a tee.`,
    "",
    `Your support of ${amount} is on its way to them — this email is your receipt.`,
    "",
    "You just helped keep a golf journey moving. That's the whole idea.",
  ];

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

/** Confirmation that someone joined the early-access list. */
export function renderEarlyAccessWelcomeEmail(input: {
  name: string;
  role: "creator" | "supporter";
}): RenderedEmail {
  const name = escapeHtml(input.name || "there");
  const roleLine =
    input.role === "creator"
      ? "As a creator, you'll be among the first to set up goals and let supporters buy you a tee."
      : "As a supporter, you'll be among the first to back the golfers whose journeys you follow.";

  const bodyHtml = [
    paragraph(`Hi ${name}, you're on the list.`),
    paragraph(escapeHtml(roleLine)),
    paragraph("We'll email you the moment early access opens. No spam in the meantime."),
  ].join("");

  const textLines = [
    `Hi ${input.name || "there"}, you're on the list.`,
    "",
    roleLine,
    "",
    "We'll email you the moment early access opens. No spam in the meantime.",
  ];

  return {
    subject: `You're on the ${siteConfig.name} early-access list`,
    html: renderEmailLayout({
      preheader: "You're on the early-access list.",
      heading: "Welcome to the early list",
      bodyHtml,
    }),
    text: renderTextEmail(textLines),
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
