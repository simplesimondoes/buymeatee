"use client";

import { Check, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

import { useSession } from "@/components/auth/use-session";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  localeLabels,
  locales,
  type AppLocale,
} from "@/i18n/locales";

/** Belt-and-braces: the proxy also syncs this cookie to the URL locale. */
function persistLocaleCookie(next: AppLocale) {
  document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;samesite=lax`;
}

type LanguageSwitcherProps = {
  /** "light" for dark backgrounds (footer), "dark" for light backgrounds. */
  tone?: "dark" | "light";
  /** Where the menu opens relative to the button. */
  align?: "left" | "right";
  direction?: "down" | "up";
};

/**
 * Language selector (ADR-019). Native-language labels — never flags-only.
 * Switching preserves the current route and query, updates the NEXT_LOCALE
 * cookie (belt-and-braces; the proxy also syncs it) and, for signed-in
 * users, persists profiles.preferred_locale fire-and-forget.
 *
 * Disclosure-menu pattern matching components/account-menu.tsx: Escape and
 * outside-click close, focus management, ArrowUp/Down roam items.
 */
export function LanguageSwitcher({
  tone = "dark",
  align = "right",
  direction = "down",
}: LanguageSwitcherProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const [, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close(false);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  const onItemKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitemradio"]',
      ) ?? [],
    );
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "ArrowDown"
        ? (current + 1) % items.length
        : (current - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  function selectLocale(next: AppLocale) {
    close(false);
    if (next === locale) return;

    persistLocaleCookie(next);

    if (session.status === "authed") {
      void fetch("/api/profile/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLocale: next }),
      }).catch(() => {
        // Non-fatal: the cookie still carries the preference.
      });
    }

    // Same route + query + hash, new locale — no state reset beyond the
    // normal navigation.
    const search =
      typeof window === "undefined"
        ? ""
        : `${window.location.search}${window.location.hash}`;
    startTransition(() => {
      router.replace(`${pathname}${search}`, { locale: next });
    });
  }

  const buttonTone =
    tone === "light"
      ? "border-white/25 text-white/85 hover:border-white/60 hover:text-white"
      : "border-forest/20 text-forest hover:border-forest hover:bg-forest/5";

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("language.switcherLabel")}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors ${buttonTone}`}
      >
        <Globe aria-hidden="true" className="h-4 w-4" />
        <span>{localeLabels[locale]}</span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t("language.label")}
          className={`absolute z-50 w-44 rounded-2xl border border-stone bg-white p-1.5 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          } ${direction === "up" ? "bottom-full mb-2" : "mt-2"}`}
        >
          {locales.map((candidate, index) => {
            const selected = candidate === locale;
            return (
              <button
                key={candidate}
                ref={index === 0 ? firstItemRef : undefined}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                lang={candidate}
                onClick={() => selectLocale(candidate)}
                onKeyDown={onItemKeyDown}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-ink/80 transition-colors hover:bg-forest/5 hover:text-forest"
              >
                {localeLabels[candidate]}
                {selected ? (
                  <Check aria-hidden="true" className="h-4 w-4 text-forest" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
