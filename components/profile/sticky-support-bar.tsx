"use client";

import { useEffect, useState } from "react";

import { SupportCta, type HeroGoal } from "@/components/profile/support-cta";

/**
 * A support call-to-action that docks to the bottom of the screen once the
 * in-header button scrolls out of view — so supporting is always one tap away
 * on phones. Rendered only for creators who can actually receive Tees. Mirrors
 * the hero CTA: pre-selects the leading goal when there is one, otherwise
 * general support, then scrolls to the composer.
 */
export function StickySupportBar({
  name,
  topGoal,
}: {
  name: string;
  topGoal: HeroGoal | null;
}) {
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
      <SupportCta
        name={name}
        topGoal={topGoal}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-forest px-6 text-base font-medium text-white transition-colors hover:bg-forest-dark"
        tabIndex={visible ? undefined : -1}
      />
    </div>
  );
}
