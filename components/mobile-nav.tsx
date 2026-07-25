"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Avatar } from "@/components/profile/avatar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Wordmark } from "@/components/logo";
import { useSession } from "@/components/auth/use-session";
import { Link } from "@/i18n/navigation";
import { authActions, headerActions, primaryNavigation } from "@/lib/site";

/**
 * Accessible mobile navigation: toggle button + full-screen panel.
 * Client island — the rest of the header stays server rendered.
 */
export function MobileNav() {
  const t = useTranslations("common");
  const label = (key: string) => t(key as Parameters<typeof t>[0]);
  const [open, setOpen] = useState(false);
  const session = useSession();
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  // Restore focus to the toggle after the panel closes (it remounts then).
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!open && wasOpen.current) {
      toggleRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <div className="lg:hidden">
      {/* Hidden while the panel is open — the panel's own close button is
          the single close control, avoiding a duplicate focusable button
          behind the modal overlay. */}
      {!open ? (
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={false}
          aria-controls={panelId}
          onClick={() => setOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-forest hover:bg-forest/5"
        >
          <Menu aria-hidden="true" />
          <span className="sr-only">{t("nav.openMenu")}</span>
        </button>
      ) : null}

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.siteNavigation")}
          className="fixed inset-0 z-50 flex flex-col bg-white"
        >
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <span className="inline-flex items-center text-forest">
              <Wordmark />
            </span>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-forest hover:bg-forest/5"
            >
              <X aria-hidden="true" />
              <span className="sr-only">{t("nav.closeMenu")}</span>
            </button>
          </div>
          <nav
            aria-label={t("nav.primaryLabel")}
            className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 pb-8 pt-4 sm:px-6"
          >
            {primaryNavigation.map((item, index) => (
              <Link
                key={item.href}
                ref={index === 0 ? firstLinkRef : undefined}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3.5 font-serif text-2xl font-medium text-forest hover:bg-forest/5"
              >
                {label(item.labelKey)}
              </Link>
            ))}
            <div className="mt-6 flex flex-col gap-3">
              {session.status === "authed" ? (
                <>
                  <div className="flex items-center gap-3 px-1 pb-2">
                    <Avatar
                      src={session.avatarUrl}
                      name={session.displayName || session.username || t("account.fallbackName")}
                      size="sm"
                    />
                    <span className="truncate text-base font-medium text-forest">
                      {session.displayName || session.username || t("account.fallbackName")}
                    </span>
                  </div>
                  <Link
                    href={authActions.dashboard.href}
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-forest px-6 text-base font-medium text-white hover:bg-forest-dark"
                  >
                    {t("actions.dashboard")}
                  </Link>
                  {session.username ? (
                    <Link
                      href={`/t/${session.username}`}
                      onClick={() => setOpen(false)}
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-forest/30 px-6 text-base font-medium text-forest hover:border-forest"
                    >
                      {t("actions.myPage")}
                    </Link>
                  ) : null}
                  <Link
                    href="/settings/profile"
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-forest/30 px-6 text-base font-medium text-forest hover:border-forest"
                  >
                    {t("actions.settings")}
                  </Link>
                  {session.isAdmin ? (
                    <Link
                      href="/admin/payments"
                      onClick={() => setOpen(false)}
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-forest/30 px-6 text-base font-medium text-forest hover:border-forest"
                    >
                      {t("actions.admin")}
                    </Link>
                  ) : null}
                  <form action={authActions.signOut.href} method="post">
                    <button
                      type="submit"
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 text-base font-medium text-ink/70 hover:text-forest"
                    >
                      {t("actions.logOut")}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href={headerActions.primary.href}
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-forest px-6 text-base font-medium text-white hover:bg-forest-dark"
                  >
                    {t("actions.register")}
                  </Link>
                  <Link
                    href={headerActions.secondary.href}
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-forest/30 px-6 text-base font-medium text-forest hover:border-forest"
                  >
                    {t("actions.logIn")}
                  </Link>
                </>
              )}
            </div>
            <div className="mt-6 border-t border-stone pt-5">
              <LanguageSwitcher direction="up" align="left" />
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
