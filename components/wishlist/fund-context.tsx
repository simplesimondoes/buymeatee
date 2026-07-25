"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Bridges the public wish-list cards to the gift composer (ADR-018). Clicking
 * "Fund this" on an item selects it here; the composer reads the selection,
 * locks the amount to the item's price, and funds it outright. Kept tiny and
 * optional: outside a provider the default no-ops, so the composer still works
 * as a general Tee form anywhere it's used.
 */

export interface FundSelection {
  id: string;
  title: string;
  /** Integer minor units — the exact price the supporter pays. */
  priceAmount: number;
}

interface FundContextValue {
  selected: FundSelection | null;
  select: (item: FundSelection) => void;
  clear: () => void;
}

const FundContext = createContext<FundContextValue>({
  selected: null,
  select: () => {},
  clear: () => {},
});

export function useFund(): FundContextValue {
  return useContext(FundContext);
}

export function FundProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<FundSelection | null>(null);
  const select = useCallback((item: FundSelection) => setSelected(item), []);
  const clear = useCallback(() => setSelected(null), []);
  const value = useMemo(
    () => ({ selected, select, clear }),
    [selected, select, clear],
  );
  return <FundContext.Provider value={value}>{children}</FundContext.Provider>;
}
