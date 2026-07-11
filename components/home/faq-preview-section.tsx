import { ButtonLink } from "@/components/button-link";
import { FaqAccordion } from "@/components/faq-accordion";
import { SectionHeading } from "@/components/section-heading";
import { homepageFaqs } from "@/lib/content/faqs";

export function FaqPreviewSection() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow="FAQ"
          heading="Fair questions, straight answers"
        />
        <div className="mt-10">
          <FaqAccordion faqs={homepageFaqs} />
        </div>
        <div className="mt-8 text-center">
          <ButtonLink href="/faq" variant="secondary">
            Read the full FAQ
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
