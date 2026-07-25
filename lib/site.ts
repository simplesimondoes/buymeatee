/**
 * Central brand and site configuration.
 * Navigation, footer links and identity live here — not scattered through components.
 *
 * Labels are message keys in the `common` namespace (messages/<locale>/common.json);
 * hrefs are bare, locale-free paths — the Link component from @/i18n/navigation
 * adds the active locale prefix at render time.
 */

export const siteConfig = {
  name: "BuyMeATee",
  domain: "buymeatee.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://buymeatee.com",
  defaultTitle: "BuyMeATee — Support the Golf Journey",
  titleTemplate: "%s | BuyMeATee",
  description:
    "Support golf creators, aspiring players and independent voices as they chase meaningful goals. Follow the journey and buy them a tee.",
  /**
   * Only add entries with real, configured destinations.
   * Empty by design — no dead social icons (see CLAUDE.md hard rules).
   */
  socialLinks: [] as { label: string; href: string }[],
} as const;

export type NavItem = {
  /** Message key inside the `common` namespace, e.g. "nav.discover". */
  labelKey: string;
  href: string;
};

export const primaryNavigation: NavItem[] = [
  { labelKey: "nav.discover", href: "/discover" },
  { labelKey: "nav.howItWorks", href: "/how-it-works" },
  { labelKey: "nav.forCreators", href: "/for-creators" },
  { labelKey: "nav.forSupporters", href: "/for-supporters" },
  { labelKey: "nav.blog", href: "/blog" },
  { labelKey: "nav.faq", href: "/faq" },
];

export const headerActions = {
  primary: { labelKey: "actions.register", href: "/sign-in" },
  secondary: { labelKey: "actions.logIn", href: "/sign-in" },
} as const;

/**
 * Header actions shown once a visitor is signed in. `myPage` is completed with
 * the creator's username at render time; `signOut` posts to the server route
 * that clears the session cookie (unprefixed — route handlers carry no locale).
 */
export const authActions = {
  dashboard: { labelKey: "actions.dashboard", href: "/dashboard" },
  myPage: { labelKey: "actions.myPage" },
  signOut: { labelKey: "actions.logOut", href: "/auth/sign-out" },
} as const;

export const footerNavigation: { headingKey: string; items: NavItem[] }[] = [
  {
    headingKey: "footer.productHeading",
    items: [
      { labelKey: "nav.discover", href: "/discover" },
      { labelKey: "nav.howItWorks", href: "/how-it-works" },
      { labelKey: "nav.forCreators", href: "/for-creators" },
      { labelKey: "nav.forSupporters", href: "/for-supporters" },
      { labelKey: "actions.signIn", href: "/sign-in" },
    ],
  },
  {
    headingKey: "footer.companyHeading",
    items: [
      { labelKey: "footer.about", href: "/about" },
      { labelKey: "nav.blog", href: "/blog" },
      { labelKey: "nav.faq", href: "/faq" },
    ],
  },
  {
    headingKey: "footer.legalHeading",
    items: [
      { labelKey: "footer.privacy", href: "/privacy" },
      { labelKey: "footer.terms", href: "/terms" },
      { labelKey: "footer.impressum", href: "/impressum" },
      { labelKey: "footer.accessibility", href: "/accessibility" },
    ],
  },
];
