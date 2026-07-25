import { BadgePercent, Gift, Sparkles } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { ComponentType } from "react";

import { ButtonLink } from "@/components/button-link";
import { SectionHeading } from "@/components/section-heading";
import { getFeeConfig } from "@/lib/payments/config";

/**
 * Honest homepage pricing (ADR-021): the percentages come from the live fee
 * configuration (`getFeeConfig()`), never hardcoded copy — if the fee model
 * changes via env, this section follows. Fees are added on top of a gift, so
 * "creators receive the full gift amount" stays true by construction.
 */

const items: { id: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "free", icon: Sparkles },
  { id: "fees", icon: BadgePercent },
  { id: "onTop", icon: Gift },
];

function formatFeePercent(bps: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(bps / 10_000);
}

export async function PricingSection() {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const fees = getFeeConfig();
  const feeArgs = {
    platformPercent: formatFeePercent(fees.platformFeeBps, locale),
    paymentPercent: formatFeePercent(fees.paymentFeeBps, locale),
  };
  return (
    <section className="on-dark bg-forest">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow={t("pricing.eyebrow")}
          heading={t("pricing.heading")}
          intro={t("pricing.intro")}
          tone="dark"
        />
        <ul className="mt-12 grid gap-6 sm:grid-cols-3">
          {items.map(({ id, icon: Icon }) => (
            <li
              key={id}
              className="rounded-3xl border border-white/15 bg-white/5 p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-forest">
                <Icon aria-hidden="true" className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-semibold text-white">
                {t(`pricing.items.${id}.title` as never)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                {id === "fees"
                  ? t("pricing.items.fees.body", feeArgs)
                  : t(`pricing.items.${id}.body` as never)}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-10 text-center">
          <ButtonLink href="/faq" variant="onDarkOutline">
            {t("pricing.cta")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
