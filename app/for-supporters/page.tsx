import {
  Award,
  Bell,
  CircleAlert,
  Flag,
  Heart,
  Search,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ButtonLink } from "@/components/button-link";
import { CallToAction } from "@/components/call-to-action";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import { images } from "@/lib/content/images";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "For Golf Fans & Supporters",
  description:
    "Back the golfers you believe in. Discover creators, choose a goal and buy them a tee — then follow the journey you helped make possible.",
  path: "/for-supporters",
});

const steps: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <Search aria-hidden="true" className="h-6 w-6" />,
    title: "Discover golfers",
    body: "Find creators through their own channels first — every creator shares their BuyMeATee link with their audience. Creator discovery inside the platform is planned for later.",
  },
  {
    icon: <Flag aria-hidden="true" className="h-6 w-6" />,
    title: "Choose a goal",
    body: "Each creator shares specific goals — a trip, a season, an entry, a series. Pick the one that resonates and see exactly what your support goes towards.",
  },
  {
    icon: <Heart aria-hidden="true" className="h-6 w-6" />,
    title: "Buy them a tee",
    body: "Choose a contribution that feels right: one tee, three tees, nine holes, a full round, a green fee or your own amount. Small support, made tangible.",
  },
  {
    icon: <Bell aria-hidden="true" className="h-6 w-6" />,
    title: "Follow the progress",
    body: "Creators will post updates and milestones so you can see the goal getting closer — and know the part you played when it lands. (Planned for launch.)",
  },
  {
    icon: <Award aria-hidden="true" className="h-6 w-6" />,
    title: "Collect the journey",
    body: "Badges and collections marking the goals you've backed are on the roadmap — a record of the journeys you've been part of. (Planned for after launch.)",
  },
];

export default function ForSupportersPage() {
  const photo = images.golfersFistBump;
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "For supporters", href: "/for-supporters" }]}
        eyebrow="For golf fans"
        heading="Support the golfers you believe in."
        intro="A coffee is quickly forgotten. A tee, a round or a tournament entry becomes part of a story — one you helped write."
      />

      <section className="bg-offwhite">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
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
            <div>
              <SectionHeading
                eyebrow="What buying a tee means"
                heading="Small gestures, real momentum"
                align="left"
                intro="Buying a tee is golf's version of saying keep going. It's a contribution towards something specific — a green fee, a tournament entry, the travel to get there — sized so anyone can take part."
              />
              <p className="mt-6 text-base leading-relaxed text-ink/75">
                Every contribution sits against a visible goal with visible
                progress, so you always know what you&apos;re helping to make
                happen — and creators always know who to thank.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supporter steps */}
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow="How supporting works"
            heading="From follower to part of the story"
          />
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => (
              <li
                key={step.title}
                className="rounded-2xl bg-white p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-forest">
                  {step.icon}
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-forest">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Honest boundary */}
      <section className="bg-offwhite">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="rounded-3xl border border-stone bg-white p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <CircleAlert
                aria-hidden="true"
                className="mt-1 h-6 w-6 shrink-0 text-gold-deep"
              />
              <div>
                <h2 className="font-serif text-xl font-semibold text-forest">
                  Support, plainly defined
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  Supporting a golfer on BuyMeATee is exactly that — support.
                  It is not an investment, it does not buy ownership or a share
                  of anyone&apos;s career, and it does not guarantee content,
                  results or rewards. What you get is honest: progress you can
                  follow, milestones you helped reach, and a genuine connection
                  to a journey you believe in.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  Payments are not live yet — BuyMeATee is in early
                  development. See{" "}
                  <Link
                    href="/faq"
                    className="font-medium text-gold-deep underline hover:text-forest"
                  >
                    the FAQ
                  </Link>{" "}
                  for how payments and fees will be handled.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/#early-access" size="lg">
              Join as a supporter
            </ButtonLink>
          </div>
        </div>
      </section>

      <CallToAction
        heading="Be part of someone's next round."
        body="Join early access and follow the first journeys from the start."
      />
    </>
  );
}
