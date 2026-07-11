import { CallToAction } from "@/components/call-to-action";
import { AudiencePanels } from "@/components/home/audience-panels";
import { EarlyAccessSection } from "@/components/home/early-access-section";
import { ExampleGoalsSection } from "@/components/home/example-goals-section";
import { FaqPreviewSection } from "@/components/home/faq-preview-section";
import { Hero } from "@/components/home/hero";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { SupportOptionsSection } from "@/components/home/support-options-section";
import { TipJarSection } from "@/components/home/tip-jar-section";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorksSection />
      <AudiencePanels />
      <SupportOptionsSection />
      <ExampleGoalsSection />
      <TipJarSection />
      <EarlyAccessSection />
      <FaqPreviewSection />
      <CallToAction />
    </>
  );
}
