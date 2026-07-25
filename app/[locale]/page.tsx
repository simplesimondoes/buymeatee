import type { AppLocale } from "@/i18n/locales";
import { setRequestLocale } from "next-intl/server";

import { CallToAction } from "@/components/call-to-action";
import { AudienceGrid } from "@/components/home/audience-grid";
import { ExampleGoalsSection } from "@/components/home/example-goals-section";
import { FaqPreviewSection } from "@/components/home/faq-preview-section";
import { FeaturedGolfersSection } from "@/components/home/featured-golfers-section";
import { Hero } from "@/components/home/hero";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { PricingSection } from "@/components/home/pricing-section";
import { WhySupportersSection } from "@/components/home/why-supporters-section";

// The featured-golfers section reads published goals from Supabase (same
// hybrid rule as /discover), so the homepage is ISR rather than fully static.
export const revalidate = 300;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as AppLocale);
  return (
    <>
      <Hero />
      <AudienceGrid />
      <HowItWorksSection />
      <FeaturedGolfersSection />
      <WhySupportersSection />
      <ExampleGoalsSection />
      <PricingSection />
      <FaqPreviewSection />
      <CallToAction />
    </>
  );
}
