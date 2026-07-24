import { siteConfig } from "@/lib/site";

/**
 * Shared email layout. Pure string builders (no server-only) so templates
 * stay unit-testable. Brand colours mirror app/globals.css — email clients
 * strip CSS variables and <style>, so every colour is inlined as hex.
 */

const FOREST = "#073e2e";
const INK = "#15201b";
const MIST = "#f6f6f3";
const STONE = "#e7e6e1";
const GOLD_DEEP = "#776027";
const WHITE = "#ffffff";

/** Escape a value before interpolating it into email HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type LayoutInput = {
  /** Hidden inbox-preview line. */
  preheader: string;
  heading: string;
  /** Pre-escaped / trusted HTML for the body paragraphs and blocks. */
  bodyHtml: string;
  cta?: { label: string; url: string };
};

export function renderEmailLayout(input: LayoutInput): string {
  const { preheader, heading, bodyHtml, cta } = input;

  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
        <tr><td style="border-radius:8px;background-color:${FOREST};">
          <a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:${WHITE};text-decoration:none;border-radius:8px;">${escapeHtml(cta.label)}</a>
        </td></tr>
      </table>`
    : "";

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:${MIST};">
  <span style="display:none!important;opacity:0;color:${MIST};height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${MIST};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${WHITE};border:1px solid ${STONE};border-radius:14px;overflow:hidden;">
        <tr><td style="background-color:${FOREST};padding:22px 32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:${WHITE};letter-spacing:0.2px;">${escapeHtml(siteConfig.name)}</span>
        </td></tr>
        <tr><td style="padding:36px 32px 12px;">
          <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;color:${FOREST};">${escapeHtml(heading)}</h1>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:${INK};">${bodyHtml}</div>
          ${button}
        </td></tr>
        <tr><td style="padding:20px 32px 32px;border-top:1px solid ${STONE};">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${GOLD_DEEP};">Support the journey.</p>
          <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6b736e;">
            ${escapeHtml(siteConfig.name)} · <a href="${escapeHtml(siteConfig.url)}" style="color:#6b736e;">${escapeHtml(siteConfig.domain)}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Build the plain-text alternative from ordered lines + optional CTA. */
export function renderTextEmail(
  lines: string[],
  cta?: { label: string; url: string },
): string {
  const parts = [...lines];
  if (cta) {
    parts.push("", `${cta.label}: ${cta.url}`);
  }
  parts.push("", "Support the journey.", `${siteConfig.name} — ${siteConfig.url}`);
  return parts.join("\n");
}
