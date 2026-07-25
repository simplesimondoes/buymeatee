import { useTranslations } from "next-intl";

import { ButtonLink } from "@/components/button-link";
import { FaqAccordion } from "@/components/faq-accordion";
import { SectionHeading } from "@/components/section-heading";
import { homepageFaqs } from "@/lib/content/faqs";

export function FaqPreviewSection() {
  const t = useTranslations("home");
  const tFaq = useTranslations("faq");
  const faqs = homepageFaqs.map((item) => ({
    question: tFaq(item.questionKey as never),
    answer: tFaq(item.answerKey as never),
  }));
  return (
    <section className="bg-mist">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow={t("faqPreview.eyebrow")}
          heading={t("faqPreview.heading")}
        />
        <div className="mt-10">
          <FaqAccordion faqs={faqs} />
        </div>
        <div className="mt-8 text-center">
          <ButtonLink href="/faq" variant="secondary">
            {t("faqPreview.cta")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
