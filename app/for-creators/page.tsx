import {
  Camera,
  CircleCheck,
  Compass,
  GraduationCap,
  Map,
  Medal,
  Star,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ButtonLink } from "@/components/button-link";
import { CallToAction } from "@/components/call-to-action";
import { GoalCard } from "@/components/goal-card";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import { exampleGoals } from "@/lib/content/example-goals";
import { images } from "@/lib/content/images";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "For Golf Creators",
  description:
    "Turn followers into part of the journey. BuyMeATee helps golf creators, amateur competitors, coaches and reviewers receive goal-based support from their community.",
  path: "/for-creators",
});

const audiences: { icon: ReactNode; label: string }[] = [
  { icon: <Video aria-hidden="true" className="h-5 w-5" />, label: "YouTube golf creators" },
  { icon: <Camera aria-hidden="true" className="h-5 w-5" />, label: "TikTok and Instagram golf creators" },
  { icon: <Trophy aria-hidden="true" className="h-5 w-5" />, label: "Amateur tournament golfers" },
  { icon: <Medal aria-hidden="true" className="h-5 w-5" />, label: "Aspiring professionals" },
  { icon: <GraduationCap aria-hidden="true" className="h-5 w-5" />, label: "Golf coaches" },
  { icon: <Star aria-hidden="true" className="h-5 w-5" />, label: "Course reviewers" },
  { icon: <Map aria-hidden="true" className="h-5 w-5" />, label: "Golf travel creators" },
  { icon: <Users aria-hidden="true" className="h-5 w-5" />, label: "Women's golf creators" },
  { icon: <Compass aria-hidden="true" className="h-5 w-5" />, label: "Adaptive golf creators" },
];

const benefits = [
  "Share your story and goals with the people who already follow you",
  "Receive direct support from your community towards specific goals",
  "Keep supporters updated with progress and milestones",
  "Celebrate what your community helped make possible",
  "Spend more time creating and playing, less time chasing sponsorship",
];

const plannedWorkflow = [
  {
    title: "Create your page",
    body: "Set up your profile, your story and what you're working towards.",
  },
  {
    title: "Add a goal",
    body: "A trip, a season, an entry, new equipment — something real and specific.",
  },
  {
    title: "Share your link",
    body: "Put your BuyMeATee link wherever your audience already is.",
  },
  {
    title: "Receive support",
    body: "Supporters buy tees, holes, rounds or green fees towards your goal.",
  },
  {
    title: "Post updates",
    body: "Show progress and bring your supporters along for the ride.",
  },
  {
    title: "Reach the goal",
    body: "Celebrate it with the community that made it happen — then set the next one.",
  },
];

export default function ForCreatorsPage() {
  const photo = images.creatorVloggingGolf;
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "For creators", href: "/for-creators" }]}
        eyebrow="For golf creators"
        heading="Turn followers into part of the journey."
        intro="You create the content, play the tournaments and put in the practice. BuyMeATee gives the people who follow you a meaningful, golf-native way to back what you're working towards."
      />

      {/* Who it's for */}
      <section className="bg-offwhite">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <SectionHeading
                eyebrow="Who it's for"
                heading="Made for emerging golfers, not just famous ones"
                intro="If you have a journey worth following, you belong here — whatever the size of your audience."
                align="left"
              />
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {audiences.map((audience) => (
                  <li
                    key={audience.label}
                    className="flex items-center gap-3 rounded-2xl border border-stone bg-white px-4 py-3 text-sm text-ink/80"
                  >
                    <span className="text-gold-deep">{audience.icon}</span>
                    {audience.label}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm leading-relaxed text-ink/70">
                Junior golfers are welcome through a parent or guardian.
                Accounts involving anyone under 18 will always require an
                appropriate parent or guardian — minors will never enter
                financial agreements independently on BuyMeATee.
              </p>
            </div>
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
          </div>
        </div>
      </section>

      {/* Goal-based support */}
      <section className="on-dark bg-forest">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow="Goal-based support"
            heading="Specific goals beat vague tips"
            intro="Supporters respond to something real: a trip they can follow, a season they can back, a milestone they can celebrate with you. Goals give your community a reason to take part — and show them exactly what they helped make possible."
            tone="dark"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exampleGoals.slice(0, 3).map((goal) => (
              <GoalCard key={goal.title} goal={goal} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow="Why creators join"
            heading="Keep creating. Keep playing."
          />
          <ul className="mx-auto mt-10 max-w-2xl space-y-4">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-3 rounded-2xl bg-white px-5 py-4 text-ink/80"
              >
                <CircleCheck
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep"
                />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Planned workflow */}
      <section className="bg-offwhite">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow="Planned creator workflow"
            heading="How your page will work"
            intro="BuyMeATee is in early development — this is the workflow we're building towards."
          />
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plannedWorkflow.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-stone bg-white p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 font-serif text-lg font-semibold text-forest">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-center text-sm text-ink/70">
            Want the supporter view?{" "}
            <Link
              href="/for-supporters"
              className="font-medium text-gold-deep underline hover:text-forest"
            >
              See how supporters take part
            </Link>
            .
          </p>
          <div className="mt-10 text-center">
            <ButtonLink href="/#early-access" size="lg">
              Start your page
            </ButtonLink>
          </div>
        </div>
      </section>

      <CallToAction
        heading="Your journey deserves backing."
        body="Join early access and be among the first creators on BuyMeATee."
      />
    </>
  );
}
