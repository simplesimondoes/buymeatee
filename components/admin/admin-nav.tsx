"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

/** Tab-style navigation shared by every /admin page. */
export function AdminNav({
  showAnalytics = false,
}: {
  /**
   * Owner-only tabs (server-decided) — the analytics and social pages 404
   * everyone else.
   */
  showAnalytics?: boolean;
}) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const links = [
    { href: "/admin/payments", label: t("nav.payments") },
    { href: "/admin/users", label: t("nav.users") },
    { href: "/admin/moderation", label: t("nav.moderation") },
    ...(showAnalytics
      ? [
          { href: "/admin/analytics", label: t("nav.analytics") },
          { href: "/admin/social", label: t("nav.social") },
        ]
      : []),
  ];
  return (
    <nav aria-label={t("nav.label")} className="border-b border-stone">
      {/* Five tabs outgrow narrow screens — scroll the bar, never the page. */}
      <ul className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 sm:px-6">
        {links.map((link) => {
          const active = pathname?.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-forest text-forest"
                    : "border-transparent text-ink/60 hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
