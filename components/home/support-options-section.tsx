import {
  CircleDollarSign,
  Flag,
  Grip,
  Landmark,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { SectionHeading } from "@/components/section-heading";
import {
  supportOptionItems,
  supportOptionsNoteKey,
  type SupportOptionIcon,
} from "@/lib/content/support-options";

const icons: Record<SupportOptionIcon, ReactNode> = {
  tee: <Flag aria-hidden="true" className="h-5 w-5" />,
  tees: <Grip aria-hidden="true" className="h-5 w-5" />,
  nine: <LayoutGrid aria-hidden="true" className="h-5 w-5" />,
  eighteen: <Landmark aria-hidden="true" className="h-5 w-5" />,
  greenFee: <CircleDollarSign aria-hidden="true" className="h-5 w-5" />,
  custom: <Sparkles aria-hidden="true" className="h-5 w-5" />,
};

export function SupportOptionsSection() {
  const t = useTranslations("home");
  const tContent = useTranslations("content");
  return (
    <section className="on-dark bg-forest-dark">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow={t("supportOptions.eyebrow")}
          heading={t("supportOptions.heading")}
          intro={t("supportOptions.intro")}
          tone="dark"
        />
        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supportOptionItems.map((option) => (
            <li
              key={option.id}
              className="rounded-2xl border border-white/15 bg-forest p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gold">
                  {icons[option.icon]}
                </span>
                <h3 className="font-serif text-lg font-semibold text-white">
                  {tContent(option.nameKey as never)}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                {tContent(option.descriptionKey as never)}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-sm text-white/60">
          {tContent(supportOptionsNoteKey as never)}
        </p>
      </div>
    </section>
  );
}
