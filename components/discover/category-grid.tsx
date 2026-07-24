"use client";

import { SectionHeading } from "@/components/section-heading";
import { useDiscover } from "@/components/discover/discover-context";
import { discoverCategories } from "@/lib/discover/categories";

/**
 * Browse-by-category chips. Selecting one filters the browse section below and
 * scrolls to it — a fast way in for supporters who know the kind of journey
 * they want to back.
 */
export function CategoryGrid() {
  const { setCategory, focusBrowse } = useDiscover();

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Categories"
          heading="Find your kind of golf"
          intro="From aspiring pros to club projects and charities — browse the journeys that matter to you."
          align="left"
        />
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {discoverCategories.map(({ slug, label, icon: Icon }) => (
            <li key={slug}>
              <button
                type="button"
                onClick={() => {
                  setCategory(slug);
                  focusBrowse();
                }}
                className="group flex w-full items-center gap-3 rounded-2xl border border-stone bg-white px-4 py-4 text-left transition-colors hover:border-forest hover:bg-forest/5"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist text-forest transition-colors group-hover:bg-forest group-hover:text-white">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-forest">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
