"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { GoalCardView } from "@/components/discover/goal-card-view";
import {
  useDiscover,
  type DiscoverSort,
} from "@/components/discover/discover-context";
import { SectionHeading } from "@/components/section-heading";
import { categoryLabelKey, discoverCategories } from "@/lib/discover/categories";
import type { DiscoverGoalCard } from "@/lib/discover/types";

/** How many journeys to show before the supporter asks for more. */
const PAGE_SIZE = 6;

/** Sort options with their `discover`-namespace label keys. */
const SORT_OPTIONS: { value: DiscoverSort; labelKey: string }[] = [
  { value: "newest", labelKey: "browse.sort.newest" },
  { value: "most-supported", labelKey: "browse.sort.mostSupported" },
  { value: "near-completion", labelKey: "browse.sort.nearCompletion" },
  { value: "trending", labelKey: "browse.sort.trending" },
];

function sortGoals(goals: DiscoverGoalCard[], sort: DiscoverSort) {
  const copy = [...goals];
  switch (sort) {
    case "most-supported":
      return copy.sort((a, b) => b.raisedMinor - a.raisedMinor);
    case "near-completion":
      return copy.sort((a, b) => b.percent - a.percent);
    case "trending":
      return copy.sort(
        (a, b) => b.percent - a.percent || b.raisedMinor - a.raisedMinor,
      );
    case "newest":
    default:
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

/**
 * The Discover search-and-filter surface. Operates over the full set of goals
 * (real + labelled Preview) so a supporter with no specific creator in mind can
 * search by name, project, place or category and sort by what matters to them.
 *
 * Preview cards carry `content`-namespace message keys in their text fields
 * (see lib/discover/types.ts), so search and the country facet resolve them to
 * the visitor's language first — a supporter searches what they can read.
 */
export function DiscoverBrowser({ goals }: { goals: DiscoverGoalCard[] }) {
  const t = useTranslations("discover");
  const tContent = useTranslations("content");
  const {
    query,
    setQuery,
    category,
    setCategory,
    country,
    setCountry,
    sort,
    setSort,
  } = useDiscover();

  // Display text for fields that hold message keys on Preview cards.
  const resolved = useMemo(() => {
    const text = (goal: DiscoverGoalCard, value: string | null) =>
      value ? (goal.isPreview ? tContent(value as never) : value) : null;
    return new Map(
      goals.map((goal) => [
        goal.key,
        {
          title: text(goal, goal.title) ?? goal.title,
          location: text(goal, goal.location),
          country: text(goal, goal.country),
        },
      ]),
    );
  }, [goals, tContent]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const goal of goals) {
      const display = resolved.get(goal.key)?.country;
      if (display) set.add(display);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [goals, resolved]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const goal of goals) {
      if (goal.category) set.add(goal.category);
    }
    return discoverCategories.filter((c) => set.has(c.slug));
  }, [goals]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = goals.filter((goal) => {
      const display = resolved.get(goal.key);
      if (category && goal.category !== category) return false;
      if (country && display?.country !== country) return false;
      if (q) {
        const haystack = [
          display?.title,
          goal.creatorName,
          display?.location,
          display?.country,
          goal.category ? t(categoryLabelKey(goal.category) as never) : null,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return sortGoals(filtered, sort);
  }, [goals, resolved, query, category, country, sort, t]);

  const hasFilters = Boolean(query || category || country);

  // Show a first page, then reveal more on request; reset when the search or
  // filters change so a new result set always starts from the top of its list.
  const signature = `${query}|${category}|${country}|${sort}`;
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [prevSignature, setPrevSignature] = useState(signature);
  if (signature !== prevSignature) {
    setPrevSignature(signature);
    setVisible(PAGE_SIZE);
  }
  const shown = results.slice(0, visible);

  return (
    <section id="browse" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow={t("browse.eyebrow")}
          heading={t("browse.heading")}
          intro={t("browse.intro")}
          align="left"
        />

        <div className="mt-8 rounded-3xl border border-stone bg-mist p-4 sm:p-5">
          <label htmlFor="discover-search" className="sr-only">
            {t("browse.searchLabel")}
          </label>
          <div className="flex items-center gap-2 rounded-full border border-stone bg-white px-3">
            <Search aria-hidden="true" className="h-5 w-5 text-ink/40" />
            <input
              id="discover-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("browse.searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              {t("browse.filter")}
            </span>

            <FilterSelect
              label={t("browse.category")}
              value={category}
              onChange={setCategory}
              options={categories.map((c) => ({
                value: c.slug,
                label: t(categoryLabelKey(c.slug) as never),
              }))}
              allLabel={t("browse.allCategories")}
            />
            <FilterSelect
              label={t("browse.country")}
              value={country}
              onChange={setCountry}
              options={countries.map((c) => ({ value: c, label: c }))}
              allLabel={t("browse.allCountries")}
            />
            <FilterSelect
              label={t("browse.sortLabel")}
              value={sort}
              onChange={(value) => setSort(value as DiscoverSort)}
              options={SORT_OPTIONS.map((option) => ({
                value: option.value,
                label: t(option.labelKey as never),
              }))}
            />

            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("");
                  setCountry("");
                }}
                className="text-sm font-medium text-gold-deep hover:text-forest"
              >
                {t("browse.clear")}
              </button>
            ) : null}
          </div>
        </div>

        <p className="mt-6 text-sm text-ink/70" aria-live="polite">
          {t("browse.resultCount", { count: results.length })}
        </p>

        {results.length > 0 ? (
          <>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((goal) => (
                <GoalCardView key={goal.key} goal={goal} />
              ))}
            </div>
            {results.length > visible ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone bg-white px-6 text-sm font-medium text-forest transition-colors hover:bg-mist"
                >
                  {t("browse.showMore")}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-4 rounded-3xl border border-dashed border-stone bg-white p-10 text-center">
            <p className="text-sm leading-relaxed text-ink/70">
              {t("browse.empty")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  /** When set, an "all" option (empty value) is prepended. */
  allLabel?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-stone bg-white px-3 py-2 text-sm">
      <span className="text-ink/55">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent font-medium text-forest focus:outline-none"
      >
        {allLabel ? <option value="">{allLabel}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
