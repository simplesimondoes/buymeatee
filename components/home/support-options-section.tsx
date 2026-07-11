import {
  CircleDollarSign,
  Flag,
  Grip,
  Landmark,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

import { SectionHeading } from "@/components/section-heading";
import {
  supportOptions,
  supportOptionsNote,
  type SupportOption,
} from "@/lib/content/support-options";

const icons: Record<SupportOption["icon"], ReactNode> = {
  tee: <Flag aria-hidden="true" className="h-5 w-5" />,
  tees: <Grip aria-hidden="true" className="h-5 w-5" />,
  nine: <LayoutGrid aria-hidden="true" className="h-5 w-5" />,
  eighteen: <Landmark aria-hidden="true" className="h-5 w-5" />,
  greenFee: <CircleDollarSign aria-hidden="true" className="h-5 w-5" />,
  custom: <Sparkles aria-hidden="true" className="h-5 w-5" />,
};

export function SupportOptionsSection() {
  return (
    <section className="on-dark bg-forest-dark">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow="Support options"
          heading="Golf-native ways to help"
          intro="Not coffees, not tips — tees, holes, rounds and green fees."
          tone="dark"
        />
        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supportOptions.map((option) => (
            <li
              key={option.name}
              className="rounded-2xl border border-cream/15 bg-forest p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream/10 text-gold">
                  {icons[option.icon]}
                </span>
                <h3 className="font-serif text-lg font-semibold text-cream">
                  {option.name}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-cream/75">
                {option.description}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-sm text-cream/60">
          {supportOptionsNote}
        </p>
      </div>
    </section>
  );
}
