"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Shared state for the two interactive Discover islands (the hero search bar
 * and the browse/filter grid) so a search or category tap up top drives the
 * results section further down the page.
 */

export type DiscoverSort =
  | "newest"
  | "most-supported"
  | "near-completion"
  | "trending";

type DiscoverState = {
  query: string;
  setQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  sort: DiscoverSort;
  setSort: (value: DiscoverSort) => void;
  /** Scroll to the browse section and focus its search input. */
  focusBrowse: () => void;
};

const DiscoverContext = createContext<DiscoverState | null>(null);

export function DiscoverProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [sort, setSort] = useState<DiscoverSort>("newest");

  const focusBrowse = useCallback(() => {
    const section = document.getElementById("browse");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      const input = document.getElementById("discover-search");
      if (input instanceof HTMLInputElement) {
        input.focus({ preventScroll: true });
      }
    }, 350);
  }, []);

  const value = useMemo(
    () => ({
      query,
      setQuery,
      category,
      setCategory,
      country,
      setCountry,
      sort,
      setSort,
      focusBrowse,
    }),
    [query, category, country, sort, focusBrowse],
  );

  return (
    <DiscoverContext.Provider value={value}>
      {children}
    </DiscoverContext.Provider>
  );
}

export function useDiscover(): DiscoverState {
  const context = useContext(DiscoverContext);
  if (!context) {
    throw new Error("useDiscover must be used within a DiscoverProvider");
  }
  return context;
}
