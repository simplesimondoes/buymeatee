import type { AppLocale } from "@/i18n/locales";
import { setRequestLocale } from "next-intl/server";

import { CallToAction } from "@/components/call-to-action";
import { AudiencePanels } from "@/components/home/audience-panels";
import { ExampleGoalsSection } from "@/components/home/example-goals-section";
import { FaqPreviewSection } from "@/components/home/faq-preview-section";
import { Hero } from "@/components/home/hero";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { SupportOptionsSection } from "@/components/home/support-options-section";
import { TipJarSection } from "@/components/home/tip-jar-section";

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
      <TipJarSection />
      <HowItWorksSection />
      <AudiencePanels />
      <SupportOptionsSection />
      <ExampleGoalsSection />
      <FaqPreviewSection />
      <CallToAction />
    </>
  );
}
