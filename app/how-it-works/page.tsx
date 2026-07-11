import type { Metadata } from "next";
import Image from "next/image";

import { CallToAction } from "@/components/call-to-action";
import { ExampleBadge } from "@/components/example-badge";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import { images } from "@/lib/content/images";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "How It Works",
  description:
    "How BuyMeATee works for golf creators and supporters: share a goal, buy a tee, follow the journey. Simple, transparent and built for golf.",
  path: "/how-it-works",
});

const creatorJourney = [
  {
    title: "Create a page",
    body: "Your profile, your story, your journey — set up in minutes.",
  },
  {
    title: "Share your story",
    body: "Tell people who you are, what you play and where you're heading.",
  },
  {
    title: "Add a goal",
    body: "Something specific and real: a trip, a season, an entry, a series.",
  },
  {
    title: "Share your link",
    body: "Drop your page link where your audience already follows you.",
  },
  {
    title: "Receive support",
    body: "Tees, holes, rounds and green fees from the people backing you.",
  },
  {
    title: "Post updates",
    body: "Keep supporters close to the journey they're helping to fund.",
  },
];

const supporterJourney = [
  {
    title: "Discover a creator",
    body: "Follow their link from YouTube, TikTok, Instagram or the course.",
  },
  {
    title: "Choose a goal",
    body: "Pick the journey that resonates — and see exactly what it needs.",
  },
  {
    title: "Buy a tee",
    body: "One tee, three tees, nine holes, a round, a green fee — or your own amount.",
  },
  {
    title: "Leave a message",
    body: "A word of encouragement travels further than you'd think.",
  },
  {
    title: "Follow progress",
    body: "Watch the goal move closer with every update.",
  },
  {
    title: "Celebrate milestones",
    body: "When the goal lands, you're part of the story.",
  },
];

function JourneyList({
  steps,
  tone,
}: {
  steps: { title: string; body: string }[];
  tone: "light" | "dark";
}) {
  const numberColour = tone === "dark" ? "text-gold" : "text-gold-deep";
  const titleColour = tone === "dark" ? "text-cream" : "text-forest";
  const bodyColour = tone === "dark" ? "text-cream/75" : "text-ink/70";
  const divide = tone === "dark" ? "divide-cream/15" : "divide-stone";
  return (
    <ol className={`mt-8 divide-y ${divide}`}>
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-5 py-5">
          <span
            className={`font-serif text-2xl font-semibold ${numberColour}`}
            aria-hidden="true"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className={`font-serif text-lg font-semibold ${titleColour}`}>
              {step.title}
            </h3>
            <p className={`mt-1 text-sm leading-relaxed ${bodyColour}`}>
              {step.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function HowItWorksPage() {
  const photo = images.friendsWalkingFairway;
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "How it works", href: "/how-it-works" }]}
        eyebrow="How it works"
        heading="Simple. Transparent. Golf."
        intro="Two journeys, one platform: creators share real golfing goals, supporters help make them happen. Here's how each side will work."
      />

      <section className="bg-offwhite">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <p className="mx-auto max-w-2xl text-center text-sm text-ink/70">
            <ExampleBadge label="Preview" className="mr-2 align-middle" />
            BuyMeATee is in early development. The journeys below describe the
            product we&apos;re building — features are planned, not yet live.
          </p>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="on-dark rounded-3xl bg-forest p-6 sm:p-8 lg:p-10">
              <SectionHeading
                eyebrow="The creator journey"
                heading="Share the journey"
                align="left"
                tone="dark"
                as="h2"
              />
              <JourneyList steps={creatorJourney} tone="dark" />
            </div>
            <div className="rounded-3xl border border-stone bg-white p-6 sm:p-8 lg:p-10">
              <SectionHeading
                eyebrow="The supporter journey"
                heading="Back the journey"
                align="left"
                as="h2"
              />
              <JourneyList steps={supporterJourney} tone="light" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-24">
          <div className="overflow-hidden rounded-3xl">
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="h-auto w-full object-cover"
            />
          </div>
          <SectionHeading
            eyebrow="Why it matters"
            heading="Golf journeys are better shared"
            align="left"
            intro="Green fees, entries, travel and gear add up fast — and the golfers creating the content and chasing the goals usually carry it all themselves. BuyMeATee spreads that weight across the community that wants to see them succeed."
          />
        </div>
      </section>

      <CallToAction />
    </>
  );
}
