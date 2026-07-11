import { EarlyAccessForm } from "@/components/early-access-form";
import { SectionHeading } from "@/components/section-heading";

export function EarlyAccessSection() {
  return (
    <section id="early-access" className="scroll-mt-8 bg-offwhite">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow="Early access"
          heading="Be there from the first tee"
          intro="BuyMeATee is in early development. Register your interest and help shape how golf supports its creators."
        />
        <div className="mt-10">
          <EarlyAccessForm />
        </div>
      </div>
    </section>
  );
}
