/**
 * Central brand and site configuration.
 * Navigation, footer links and identity live here — not scattered through components.
 */

export const siteConfig = {
  name: "BuyMeATee",
  domain: "buymeatee.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://buymeatee.com",
  defaultTitle: "BuyMeATee — Support the Golf Journey",
  titleTemplate: "%s | BuyMeATee",
  description:
    "Support golf creators, aspiring players and independent voices as they chase meaningful goals. Follow the journey and buy them a tee.",
  locale: "en_GB",
  /**
   * Only add entries with real, configured destinations.
   * Empty by design — no dead social icons (see CLAUDE.md hard rules).
   */
  socialLinks: [] as { label: string; href: string }[],
} as const;

export type NavItem = {
  label: string;
  href: string;
};

export const primaryNavigation: NavItem[] = [
  { label: "How it works", href: "/how-it-works" },
  { label: "For creators", href: "/for-creators" },
  { label: "For supporters", href: "/for-supporters" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
];

export const headerActions = {
  primary: { label: "Start your page", href: "/#early-access" },
  secondary: { label: "Join early access", href: "/#early-access" },
} as const;

export const footerNavigation: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Product",
    items: [
      { label: "How it works", href: "/how-it-works" },
      { label: "For creators", href: "/for-creators" },
      { label: "For supporters", href: "/for-supporters" },
      { label: "Join early access", href: "/#early-access" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    heading: "Legal",
    items: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];
