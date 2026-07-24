"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Tab-style navigation shared by every dashboard page, so goals, updates and
 * profile are always one click away — not buried inside the overview.
 * `exact` marks the overview link so it isn't highlighted on sub-pages.
 */
const links = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/goals", label: "Goals" },
  { href: "/dashboard/updates", label: "Updates" },
  { href: "/dashboard/payments", label: "Payments" },
  { href: "/settings/profile", label: "Profile" },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Dashboard sections"
      className="border-b border-stone bg-white"
    >
      <ul className="mx-auto flex w-full max-w-4xl gap-1 overflow-x-auto px-4 sm:px-6">
        {links.map((link) => {
          const active = link.exact
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
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
