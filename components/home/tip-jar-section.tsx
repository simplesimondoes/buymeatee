import { Flag, HeartHandshake, ShieldCheck, Target } from "lucide-react";
import type { ReactNode } from "react";

import { SectionHeading } from "@/components/section-heading";

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
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          heading="More than just a tip jar."
          intro="BuyMeATee is designed around real golfing goals, visible progress and an ongoing connection between creators and the people supporting them."
        />
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <li key={feature.title} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest text-gold">
                {feature.icon}
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-forest">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                {feature.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
