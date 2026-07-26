"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

/**
 * Tab-style navigation shared by every dashboard page, so goals, the journey
 * and profile are always one click away — not buried inside the overview.
 * `exact` marks the overview link so it isn't highlighted on sub-pages.
 */
const links = [
  { href: "/dashboard", labelKey: "overview", exact: true },
  { href: "/dashboard/goals", labelKey: "goals" },
  { href: "/dashboard/wishlist", labelKey: "wishlist" },
  { href: "/dashboard/journey", labelKey: "journey" },
  // Merch is inserted here when enabled (see showMerch).
  { href: "/dashboard/payments", labelKey: "payments" },
  { href: "/settings/profile", labelKey: "profile" },
] as const;

const merchLink = { href: "/dashboard/merch", labelKey: "merch" } as const;

/**
 * `showMerch` is decided by the server layout (merch feature flag) so the tab
 * only appears while the merchandise feature is enabled — mirroring how the
 * admin nav gates the analytics tab.
 */
export function DashboardNav({ showMerch = false }: { showMerch?: boolean }) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const navLinks = showMerch
    ? [...links.slice(0, 4), merchLink, ...links.slice(4)]
    : links;
  return (
    <nav
      aria-label={t("nav.sections")}
      className="border-b border-stone bg-white"
    >
      <ul className="mx-auto flex w-full max-w-4xl gap-1 overflow-x-auto px-4 sm:px-6">
        {navLinks.map((link) => {
          const active =
            "exact" in link && link.exact
              ? pathname === link.href
              : pathname?.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-forest text-forest"
                    : "border-transparent text-ink/60 hover:text-ink"
                }`}
              >
                {t(`nav.${link.labelKey}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
