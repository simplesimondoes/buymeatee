/**
 * Shared constants and helper for cookie consent, kept out of the component
 * file so both the banner and the footer control can import them without
 * mixing a non-component export into a React module.
 */

export const COOKIE_CONSENT_STORAGE_KEY = "bmat-cookie-consent";
export const COOKIE_SETTINGS_EVENT = "bmat:cookie-settings";
export const COOKIE_CONSENT_CHANGED_EVENT = "bmat:cookie-consent-changed";

/** Re-opens the cookie banner so a visitor can change or withdraw consent. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}
