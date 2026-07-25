"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Carries what a supporter is funding — a goal, a wish-list item, or general
 * support (null) — from the thing they clicked down to the gift composer, so
 * intent is never lost between the click and the payment. Clicking "Support
 * this goal" on a goal card or "Fund this" on a wish-list item selects it here;
 * the composer reads the selection and shows it as a header instead of
 * defaulting to general (superseding the ADR-018 wish-list-only bridge).
 *
 * Kept optional: outside a provider the default no-ops, so the composer still
 * works as a plain Tee form anywhere it's used.
 */

export type SupportTarget =
  | { kind: "goal"; id: string; title: string; raised: number; target: number }
  | { kind: "wishlist"; id: string; title: string; priceAmount: number }
  | null;

interface SupportTargetContextValue {
  /** null means general support (no specific goal or item). */
  target: SupportTarget;
  select: (target: NonNullable<SupportTarget>) => void;
  /** Back to general support. */
  clear: () => void;
}

const SupportTargetContext = createContext<SupportTargetContextValue>({
  target: null,
  select: () => {},
  clear: () => {},
});

export function useSupportTarget(): SupportTargetContextValue {
  return useContext(SupportTargetContext);
}

/** Bring the composer into view after choosing a target. */
export function scrollToComposer(): void {
  document
    .getElementById("support-composer")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SupportTargetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [target, setTarget] = useState<SupportTarget>(null);
  const select = useCallback(
    (next: NonNullable<SupportTarget>) => setTarget(next),
    [],
  );
  const clear = useCallback(() => setTarget(null), []);
  const value = useMemo(
    () => ({ target, select, clear }),
    [target, select, clear],
  );
  return (
    <SupportTargetContext.Provider value={value}>
      {children}
    </SupportTargetContext.Provider>
  );
}
