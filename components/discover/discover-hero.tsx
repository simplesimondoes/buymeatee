"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FormEvent } from "react";

import { useDiscover } from "@/components/discover/discover-context";

/**
 * Discover hero with the primary search entry point. Typing here drives the
 * shared browse state; submitting jumps to the results section.
 */
export function DiscoverHero() {
  const t = useTranslations("discover");
  const { query, setQuery, focusBrowse } = useDiscover();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    focusBrowse();
  }

  return (
    <section className="on-dark relative overflow-hidden bg-forest">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-forest to-forest-dark"
      />
      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          {t("hero.eyebrow")}
        </p>
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
          {t("hero.heading")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
          {t("hero.intro")}
        </p>
        <form
          onSubmit={onSubmit}
          role="search"
          className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 shadow-lg"
        >
          <label htmlFor="discover-hero-search" className="sr-only">
            {t("hero.searchLabel")}
          </label>
          <span className="pl-3 text-ink/40">
            <Search aria-hidden="true" className="h-5 w-5" />
          </span>
          <input
            id="discover-hero-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("hero.searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            {t("hero.searchButton")}
          </button>
        </form>
      </div>
    </section>
  );
}
