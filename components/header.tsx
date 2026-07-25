import { useTranslations } from "next-intl";

import { HeaderAuth } from "@/components/header-auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { Link } from "@/i18n/navigation";
import { primaryNavigation } from "@/lib/site";

export function Header() {
  const t = useTranslations("common");
  const label = (key: string) => t(key as Parameters<typeof t>[0]);

  return (
    <header className="bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Logo />
        <nav
          aria-label={t("nav.primaryLabel")}
          className="hidden items-center gap-1 lg:flex"
        >
          {primaryNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink/80 transition-colors hover:bg-forest/5 hover:text-forest"
            >
              {label(item.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block">
          <LanguageSwitcher />
        </div>
        <HeaderAuth />
        <MobileNav />
      </div>
    </header>
  );
}
