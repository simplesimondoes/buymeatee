"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Wordmark } from "@/components/logo";
import { headerActions, primaryNavigation } from "@/lib/site";

/**
 * Accessible mobile navigation: toggle button + full-screen panel.
 * Client island — the rest of the header stays server rendered.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
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
          <span className="sr-only">Open menu</span>
        </button>
      ) : null}

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
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
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <nav
            aria-label="Primary"
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
                {item.label}
              </Link>
            ))}
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={headerActions.primary.href}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-forest px-6 text-base font-medium text-white hover:bg-forest-dark"
              >
                {headerActions.primary.label}
              </Link>
              <Link
                href={headerActions.secondary.href}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-forest/30 px-6 text-base font-medium text-forest hover:border-forest"
              >
                {headerActions.secondary.label}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
