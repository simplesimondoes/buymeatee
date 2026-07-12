import { Flag, Landmark, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { ButtonLink } from "@/components/button-link";
import { SectionHeading } from "@/components/section-heading";

const steps: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <UserRound aria-hidden="true" className="h-6 w-6" />,
    title: "Creators share their goals",
    body: "Golfers create a page, tell their story and show supporters what they are working towards.",
  },
  {
    icon: <Landmark aria-hidden="true" className="h-6 w-6" />,
    title: "Fans buy a tee",
    body: "Supporters choose a meaningful contribution, from a single tee to nine holes, a full round or a custom amount.",
  },
  {
    icon: <Flag aria-hidden="true" className="h-6 w-6" />,
    title: "The journey continues",
    body: "Creators share progress, milestones and updates so supporters can see what they helped make possible.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow="How it works"
          heading="Simple. Transparent. Golf."
        />
        <ol className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-6 lg:gap-10">
          {steps.map((step, index) => (
            <li key={step.title} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mist text-forest">
                {step.icon}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
                Step {index + 1}
              </p>
              <h3 className="mt-2 font-serif text-xl font-semibold text-forest">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <ButtonLink href="/how-it-works">See how it works</ButtonLink>
        </div>
      </div>
    </section>
  );
}
