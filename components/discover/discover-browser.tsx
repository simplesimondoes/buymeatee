"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";

import { GoalCardView } from "@/components/discover/goal-card-view";
import {
  useDiscover,
  type DiscoverSort,
} from "@/components/discover/discover-context";
import { SectionHeading } from "@/components/section-heading";
import { categoryLabel, discoverCategories } from "@/lib/discover/categories";
import type { DiscoverGoalCard } from "@/lib/discover/types";

const SORT_OPTIONS: { value: DiscoverSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "most-supported", label: "Most supported" },
  { value: "near-completion", label: "Near completion" },
  { value: "trending", label: "Trending" },
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
 */
export function DiscoverBrowser({ goals }: { goals: DiscoverGoalCard[] }) {
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

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const goal of goals) {
      if (goal.country) set.add(goal.country);
    }
    return Array.from(set).sort();
  }, [goals]);

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
      if (category && goal.category !== category) return false;
      if (country && goal.country !== country) return false;
      if (q) {
        const haystack = [
          goal.title,
          goal.creatorName,
          goal.location,
          goal.country,
          categoryLabel(goal.category),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return sortGoals(filtered, sort);
  }, [goals, query, category, country, sort]);

  const hasFilters = Boolean(query || category || country);

  return (
    <section id="browse" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Search"
          heading="Search every journey"
          intro="Search by creator, project, goal, place or category — then sort by what matters to you."
          align="left"
        />

        <div className="mt-8 rounded-3xl border border-stone bg-mist p-4 sm:p-5">
          <label htmlFor="discover-search" className="sr-only">
            Search creators, projects and goals
          </label>
          <div className="flex items-center gap-2 rounded-full border border-stone bg-white px-3">
            <Search aria-hidden="true" className="h-5 w-5 text-ink/40" />
            <input
              id="discover-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search creators, projects, goals…"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink/50">
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              Filter
            </span>

            <FilterSelect
              label="Category"
              value={category}
              onChange={setCategory}
              options={categories.map((c) => ({ value: c.slug, label: c.label }))}
              allLabel="All categories"
            />
            <FilterSelect
              label="Country"
              value={country}
              onChange={setCountry}
              options={countries.map((c) => ({ value: c, label: c }))}
              allLabel="All countries"
            />
            <FilterSelect
              label="Sort"
              value={sort}
              onChange={(value) => setSort(value as DiscoverSort)}
              options={SORT_OPTIONS}
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
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <p className="mt-6 text-sm text-ink/60" aria-live="polite">
          {results.length} {results.length === 1 ? "journey" : "journeys"}
        </p>

        {results.length > 0 ? (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((goal) => (
              <GoalCardView key={goal.key} goal={goal} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-dashed border-stone bg-white p-10 text-center">
            <p className="text-sm leading-relaxed text-ink/70">
              No journeys match your search yet. Try clearing a filter or a
              different term.
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
