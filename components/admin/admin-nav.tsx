"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/moderation", label: "Moderation" },
];

/** Tab-style navigation shared by every /admin page. */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="border-b border-stone">
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
