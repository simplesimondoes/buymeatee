import Image from "next/image";
import Link from "next/link";

import { ExampleBadge } from "@/components/example-badge";
import { ProgressBar } from "@/components/progress-bar";
import { goalProgress, type ExampleGoal } from "@/lib/content/example-goals";

export function GoalCard({ goal }: { goal: ExampleGoal }) {
  const progress = goalProgress(goal);
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-stone bg-white">
      <div className="relative">
        <Image
          src={goal.image.src}
          alt={goal.image.alt}
          width={goal.image.width}
          height={goal.image.height}
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
          className="h-44 w-full object-cover"
        />
        <ExampleBadge className="absolute left-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-semibold text-forest">
          {goal.title}
        </h3>
        <p className="text-sm text-ink/70">{goal.creator}</p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/75">
          {goal.description}
        </p>
        <div className="mt-4 flex items-baseline justify-between text-sm">
          <span className="font-semibold text-forest">
            £{goal.raised.toLocaleString("en-GB")} of £
            {goal.target.toLocaleString("en-GB")}
          </span>
          <span className="text-ink/70">{progress}%</span>
        </div>
        <ProgressBar
          value={progress}
          label={`Progress towards ${goal.title} (example)`}
          className="mt-2"
        />
        <Link
          href="/how-it-works"
          className="mt-5 inline-flex items-center text-sm font-medium text-gold-deep hover:text-forest"
        >
          See how goals work
          <span aria-hidden="true" className="ml-1">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
