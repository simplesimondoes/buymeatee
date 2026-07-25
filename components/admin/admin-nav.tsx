"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

/** Tab-style navigation shared by every /admin page. */
export function AdminNav({
  showAnalytics = false,
}: {
  /** Owner-only tab (server-decided) — the analytics page 404s everyone else. */
  showAnalytics?: boolean;
}) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const links = [
    { href: "/admin/payments", label: t("nav.payments") },
    { href: "/admin/users", label: t("nav.users") },
    { href: "/admin/moderation", label: t("nav.moderation") },
    ...(showAnalytics
      ? [{ href: "/admin/analytics", label: t("nav.analytics") }]
      : []),
  ];
  return (
    <nav aria-label={t("nav.label")} className="border-b border-stone">
      <ul className="mx-auto flex w-full max-w-5xl gap-1 px-4 sm:px-6">
        {links.map((link) => {
          const active = pathname?.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-medium transition-colors ${
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
