"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Avatar } from "@/components/profile/avatar";
import { Link } from "@/i18n/navigation";
import { authActions } from "@/lib/site";

type AccountMenuProps = {
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  /** Shows the Admin shortcut. Visibility only — /admin re-checks server-side. */
  isAdmin?: boolean;
};

/**
 * Avatar button that opens an accessible dropdown of account actions.
 * Follows the disclosure-menu pattern: Escape and outside-click close it,
 * focus moves into the menu on open and returns to the button on close, and
 * Arrow keys roam between items.
 */
export function AccountMenu({
  username,
  displayName,
  avatarUrl,
  isAdmin = false,
}: AccountMenuProps) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const name = displayName || username || t("account.fallbackName");

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Close on outside click / focus leaving, and on Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close(false);
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  // Move focus into the menu once it opens.
  const firstItemRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  const onItemKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]',
      ) ?? [],
    );
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "ArrowDown"
        ? (current + 1) % items.length
        : (current - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-forest/20 py-1 pl-1 pr-3 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-forest/5"
      >
        <Avatar src={avatarUrl} name={name} size="sm" />
        <span className="max-w-[10rem] truncate">{name}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t("account.menuLabel")}
          className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-stone bg-white p-1.5 shadow-lg"
        >
          <p className="px-3 py-2 text-xs text-ink/50">
            {t.rich("account.signedInAs", {
              displayName: name,
              name: (chunks) => (
                <span className="font-medium text-ink/80">{chunks}</span>
              ),
            })}
          </p>
          {username ? (
            <MenuLink
              href={`/t/${username}`}
              ref={firstItemRef}
              onClick={() => close(false)}
              onKeyDown={onItemKeyDown}
            >
              {t("actions.myPage")}
            </MenuLink>
          ) : null}
          <MenuLink
            href={authActions.dashboard.href}
            ref={username ? undefined : firstItemRef}
            onClick={() => close(false)}
            onKeyDown={onItemKeyDown}
          >
            {t("actions.dashboard")}
          </MenuLink>
          <MenuLink
            href="/settings/profile"
            onClick={() => close(false)}
            onKeyDown={onItemKeyDown}
          >
            {t("actions.settings")}
          </MenuLink>
          {isAdmin ? (
            <MenuLink
              href="/admin/payments"
              onClick={() => close(false)}
              onKeyDown={onItemKeyDown}
            >
              {t("actions.admin")}
            </MenuLink>
          ) : null}
          <form action={authActions.signOut.href} method="post" className="mt-1 border-t border-stone pt-1">
            <button
              type="submit"
              role="menuitem"
              onKeyDown={onItemKeyDown}
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-ink/80 transition-colors hover:bg-forest/5 hover:text-forest"
            >
              {t("actions.logOut")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

const MenuLink = ({
  ref,
  href,
  children,
  onClick,
  onKeyDown,
}: {
  ref?: React.Ref<HTMLAnchorElement>;
  href: string;
  children: ReactNode;
  onClick: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}) => (
  <Link
    ref={ref}
    href={href}
    role="menuitem"
    onClick={onClick}
    onKeyDown={onKeyDown}
    className="block rounded-xl px-3 py-2 text-sm font-medium text-ink/80 transition-colors hover:bg-forest/5 hover:text-forest"
  >
    {children}
  </Link>
);
