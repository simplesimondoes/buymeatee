"use client";

import { useEffect, useState } from "react";

/**
 * A support call-to-action that docks to the bottom of the screen once the
 * in-header "Buy a Tee" button scrolls out of view — so donating is always one
 * tap away on phones. Rendered only for creators who can actually receive Tees.
 * Links to the goal/support section (#support); smooth scroll is handled
 * globally in globals.css.
 */
export function StickySupportBar({ name }: { name: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("support-cta-inline");
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-stone bg-white/95 px-4 py-3 backdrop-blur transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
    >
      <a
        href="#support"
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-forest px-6 text-base font-medium text-white transition-colors hover:bg-forest-dark"
        tabIndex={visible ? undefined : -1}
      >
        Buy {name} a Tee
      </a>
    </div>
  );
}
