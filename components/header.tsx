import Link from "next/link";

import { HeaderAuth } from "@/components/header-auth";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { primaryNavigation } from "@/lib/site";

export function Header() {
  return (
    <header className="bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {primaryNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink/80 transition-colors hover:bg-forest/5 hover:text-forest"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <HeaderAuth />
        <MobileNav />
      </div>
    </header>
  );
}
