import { Flag, HeartHandshake, ShieldCheck, Target } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { ExampleBadge } from "@/components/example-badge";
import { SectionHeading } from "@/components/section-heading";
import { images } from "@/lib/content/images";

const features: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <Target aria-hidden="true" className="h-6 w-6" />,
    title: "Goal based",
    body: "Support goes towards real golfing goals with visible progress.",
  },
  {
    icon: <ShieldCheck aria-hidden="true" className="h-6 w-6" />,
    title: "Secure and transparent",
    body: "Designed around transparent goals and responsible payments.",
  },
  {
    icon: <HeartHandshake aria-hidden="true" className="h-6 w-6" />,
    title: "Community first",
    body: "Built for connection between creators and their supporters.",
  },
  {
    icon: <Flag aria-hidden="true" className="h-6 w-6" />,
    title: "Built specifically for golf",
    body: "Tees, holes, rounds and green fees — by golfers, for golfers.",
  },
];

export function TipJarSection() {
  const screen = images.appConceptCreatorProfile;
  return (
    <section className="bg-mist">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <SectionHeading
              align="left"
              heading="More than just a tip jar."
              intro="BuyMeATee is designed around real golfing goals, visible progress and an ongoing connection between creators and the people supporting them."
            />
            <ul className="mt-10 grid gap-8 sm:grid-cols-2">
              {features.map((feature) => (
                <li key={feature.title} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-gold">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-forest">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                      {feature.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {/* Concept app screen from the approved UI mockups (ADR-007) */}
          <figure className="relative mx-auto w-full max-w-[300px]">
            <div className="absolute right-3 top-3 z-10">
              <ExampleBadge label="Concept" />
            </div>
            <Image
              src={screen.src}
              alt={screen.alt}
              width={screen.width}
              height={screen.height}
              sizes="300px"
              className="h-auto w-full rounded-[2rem] shadow-xl ring-1 ring-ink/10"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
