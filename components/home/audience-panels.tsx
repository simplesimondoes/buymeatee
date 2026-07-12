import { CircleCheck } from "lucide-react";
import Image from "next/image";

import { ButtonLink } from "@/components/button-link";
import { CreatorPreviewCard } from "@/components/creator-preview-card";
import { ExampleBadge } from "@/components/example-badge";
import { SectionHeading } from "@/components/section-heading";
import { images } from "@/lib/content/images";

const creatorPoints = [
  "Share your story and goals",
  "Receive direct support from your community",
  "Keep supporters updated",
  "Celebrate progress and milestones",
  "Spend more time creating and playing",
];

const supporterPoints = [
  "Buy a tee or support a specific goal",
  "Follow progress and updates",
  "Be part of the golfer's story",
  "Discover emerging golf creators",
  "Celebrate achievements together",
];

function PointList({
  points,
  tone,
}: {
  points: string[];
  tone: "light" | "dark";
}) {
  const text = tone === "dark" ? "text-white/85" : "text-ink/75";
  const icon = tone === "dark" ? "text-gold" : "text-gold-deep";
  return (
    <ul className="mt-6 space-y-3">
      {points.map((point) => (
        <li key={point} className={`flex items-start gap-3 text-sm ${text}`}>
          <CircleCheck
            aria-hidden="true"
            className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${icon}`}
          />
          {point}
        </li>
      ))}
    </ul>
  );
}

/** Concept app screen from the approved UI mockups (labelled Concept — ADR-007). */
function SupporterCollectionConcept() {
  const screen = images.appConceptSupporterCollection;
  return (
    <figure className="relative mx-auto w-full max-w-[280px]">
      <div className="absolute right-3 top-3 z-10">
        <ExampleBadge label="Concept" />
      </div>
      <Image
        src={screen.src}
        alt={screen.alt}
        width={screen.width}
        height={screen.height}
        sizes="280px"
        className="h-auto w-full rounded-[1.9rem] shadow-xl ring-1 ring-ink/10"
      />
    </figure>
  );
}

export function AudiencePanels() {
  return (
    <section className="bg-mist">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow="Who it's for"
          heading="Two sides of the same round"
          intro="Creators share the journey. Supporters make more of it possible."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Creator panel */}
          <div className="on-dark flex flex-col rounded-3xl bg-forest p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              For golf creators
            </p>
            <h3 className="mt-3 font-serif text-2xl font-semibold text-white sm:text-3xl">
              Turn followers into part of the journey.
            </h3>
            <PointList points={creatorPoints} tone="dark" />
            <div className="mt-8">
              <ButtonLink href="/#early-access" variant="onDark">
                Start your page
              </ButtonLink>
            </div>
            <div className="mt-8 max-w-sm">
              <CreatorPreviewCard />
            </div>
          </div>
          {/* Supporter panel */}
          <div className="flex flex-col rounded-3xl border border-stone bg-white p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
              For golf fans
            </p>
            <h3 className="mt-3 font-serif text-2xl font-semibold text-forest sm:text-3xl">
              Support the golfers you believe in.
            </h3>
            <PointList points={supporterPoints} tone="light" />
            <div className="mt-8">
              <ButtonLink href="/#early-access">Join as a supporter</ButtonLink>
            </div>
            <div className="mt-8">
              <SupporterCollectionConcept />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
