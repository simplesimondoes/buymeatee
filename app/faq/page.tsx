import type { Metadata } from "next";

import { CallToAction } from "@/components/call-to-action";
import { FaqAccordion } from "@/components/faq-accordion";
import { PageHeader } from "@/components/page-header";
import { StructuredData } from "@/components/structured-data";
import { allFaqs, faqGroups } from "@/lib/content/faqs";
import { pageMetadata } from "@/lib/seo/metadata";
import { faqJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description:
    "Straight answers about BuyMeATee: what it is, who can create a page, what supporters contribute towards, and how payments will work.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "FAQ", href: "/faq" }]}
        eyebrow="FAQ"
        heading="Fair questions, straight answers"
        intro="BuyMeATee is in early development, and we'd rather be honest than impressive. Here's everything we can answer today."
      />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl space-y-12 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          {faqGroups.map((group) => (
            <div key={group.heading}>
              <h2 className="font-serif text-2xl font-semibold text-forest">
                {group.heading}
              </h2>
              <div className="mt-5">
                <FaqAccordion faqs={group.faqs} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ structured data matches the visible questions above (and only those). */}
      <StructuredData data={faqJsonLd(allFaqs)} />

      <CallToAction
        heading="Still curious?"
        body="Join early access and ask us anything as the product takes shape."
      />
    </>
  );
}
