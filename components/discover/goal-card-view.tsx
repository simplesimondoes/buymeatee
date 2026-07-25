import Link from "next/link";
import { MapPin } from "lucide-react";

import { ExampleBadge } from "@/components/example-badge";
import { ProgressBar } from "@/components/progress-bar";
import { categoryLabel } from "@/lib/discover/categories";
import type { DiscoverGoalCard } from "@/lib/discover/types";
import { formatMinorAmount } from "@/lib/payments/currency";

/** A goal as browsed on Discover — real or clearly-labelled Preview. */
export function GoalCardView({ goal }: { goal: DiscoverGoalCard }) {
  const raised = formatMinorAmount(goal.raisedMinor, goal.currency);
  const target = formatMinorAmount(goal.targetMinor, goal.currency);
  const category = categoryLabel(goal.category);
  const place = goal.location ?? goal.country;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-stone bg-white">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-mist">
        {goal.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={goal.imageSrc}
            alt={goal.imageAlt}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-forest to-forest-dark" />
        )}
        {goal.isPreview ? (
          <ExampleBadge label="Preview" className="absolute left-3 top-3" />
        ) : null}
        {category ? (
          <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-forest">
            {category}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-semibold text-forest">
          {goal.title}
        </h3>
        <p className="mt-0.5 text-sm text-ink/70">
          {goal.creatorName}
          {place ? (
            <span className="inline-flex items-center gap-1 text-ink/55">
              {" · "}
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
              {place}
            </span>
          ) : null}
        </p>
        {goal.description ? (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink/75">
            {goal.description}
          </p>
        ) : (
          <div className="flex-1" />
        )}
        <div className="mt-4 flex items-baseline justify-between text-sm">
          <span className="font-semibold text-forest">
            {goal.started ? `${raised} of ${target}` : `${target} goal`}
          </span>
          <span className="shrink-0 font-semibold text-gold-deep">
            {goal.started ? `${goal.percent}%` : "Be the first"}
          </span>
        </div>
        <ProgressBar
          value={goal.percent}
          label={`Progress towards ${goal.title}: ${raised} of ${target}`}
          className="mt-2"
        />
        {goal.creatorHref ? (
          <Link
            href={goal.creatorHref}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-5 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            Support
          </Link>
        ) : (
          <Link
            href="/how-it-works"
            className="mt-5 inline-flex items-center text-sm font-medium text-gold-deep hover:text-forest"
          >
            See how goals work
            <span aria-hidden="true" className="ml-1">
              →
            </span>
          </Link>
        )}
      </div>
    </article>
  );
}
