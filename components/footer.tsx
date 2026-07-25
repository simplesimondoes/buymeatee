import { useTranslations } from "next-intl";

import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { Link } from "@/i18n/navigation";
import { footerNavigation } from "@/lib/site";

export function Footer() {
  const t = useTranslations("common");
  const label = (key: string) => t(key as Parameters<typeof t>[0]);
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark bg-forest-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Logo variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              {t("footer.description")}
            </p>
          </div>
          {footerNavigation.map((group) => (
            <nav key={group.headingKey} aria-label={label(group.headingKey)}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                {label(group.headingKey)}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/80 transition-colors hover:text-white"
                    >
                      {label(item.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-white/15 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <LanguageSwitcher tone="light" align="left" direction="up" />
            <p>{t("footer.copyright", { year })}</p>
            <CookieSettingsButton />
          </div>
          <p>
            {t.rich("footer.productLine", {
              brand: (chunks) => (
                <span className="font-medium text-white/85">{chunks}</span>
              ),
            })}
          </p>
        </div>
      </div>
    </footer>
  );
}
