"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

/** Tab-style navigation shared by every /settings page. */
export function SettingsNav() {
  const t = useTranslations("settings");
  const pathname = usePathname();
  const links = [
    { href: "/settings/profile", label: t("nav.profile") },
    { href: "/settings/payments", label: t("nav.payments") },
  ];
  return (
    <nav aria-label={t("nav.label")} className="border-b border-stone">
      <ul className="mx-auto flex w-full max-w-2xl gap-1 px-4 sm:px-6">
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
                    : "border-transparent text-ink/70 hover:text-ink"
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
