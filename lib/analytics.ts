/**
 * Thin analytics abstraction.
 *
 * No provider is installed by default — no invasive tracking, no cookies,
 * therefore no cookie banner. When a privacy-friendly provider is chosen
 * (e.g. Plausible, Fathom, Vercel Analytics), implement `send` below and
 * record the decision in arc42/09-adrs.md.
 */

export type AnalyticsEvent =
  | "creator_cta_clicked"
  | "supporter_cta_clicked"
  | "early_access_form_opened"
  | "early_access_form_submitted"
  | "faq_opened"
  | "blog_article_viewed";

export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, string>,
): void {
  if (process.env.NODE_ENV === "development") {
    // Visible during development; intentionally a no-op in production
    // until a privacy-friendly provider is deliberately configured.
    console.debug("[analytics]", event, properties ?? {});
  }
}
