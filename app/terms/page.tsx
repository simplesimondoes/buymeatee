import { ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use",
  description:
    "Terms of use for the BuyMeATee pre-launch website and early-access programme. Draft pending legal review.",
  path: "/terms",
});

const sectionHeading =
  "mt-10 font-serif text-2xl font-semibold tracking-tight text-forest";
const paragraph = "mt-4 text-base leading-relaxed text-ink/80";
const list =
  "mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-ink/80 marker:text-gold-deep";

export default function TermsPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Terms", href: "/terms" }]}
        eyebrow="Legal"
        heading="Terms of Use"
        intro="The ground rules for using this pre-launch website."
      />
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div
            role="note"
            className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-mist p-5 text-sm leading-relaxed text-ink/80"
          >
            <ScrollText
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep"
            />
            <p>
              <strong className="text-forest">
                Draft — pending legal review.
              </strong>{" "}
              These pre-launch terms are written in plain language and have not
              yet been reviewed by a lawyer. They are not legal advice. Full
              terms will be published before the product launches.
            </p>
          </div>

          <p className={paragraph}>Last updated: 11 July 2026.</p>

          <h2 className={sectionHeading}>What this website is</h2>
          <p className={paragraph}>
            buymeatee.com currently presents BuyMeATee, a golf-focused
            creator-support platform in early development, and lets you
            register interest in early access. The full product — creator
            pages, support options and payments — does not exist yet.
          </p>

          <h2 className={sectionHeading}>No payments, no financial services</h2>
          <p className={paragraph}>
            Nothing on this website takes payment, holds money or provides any
            financial service. Support options, creator cards, goals, amounts
            and progress shown on this site are illustrative examples, clearly
            labelled as such, describing how the product is intended to work at
            launch.
          </p>

          <h2 className={sectionHeading}>Early access</h2>
          <ul className={list}>
            <li>
              Registering for early access expresses interest — it creates no
              account, no obligation and no entitlement to any feature, launch
              date or pricing.
            </li>
            <li>
              You must be at least 18 to register. Junior golfers will
              participate in the future product only through an appropriate
              parent or guardian.
            </li>
            <li>
              Your registration data is handled as described in the{" "}
              <Link
                href="/privacy"
                className="font-medium text-gold-deep underline hover:text-forest"
              >
                privacy policy
              </Link>
              .
            </li>
          </ul>

          <h2 className={sectionHeading}>Content and accuracy</h2>
          <p className={paragraph}>
            We work to keep this website honest and accurate: fictional
            examples are labelled, and we avoid claims about features that do
            not exist. Product plans described here — including support
            mechanics, workflows and future features — may change as BuyMeATee
            develops. Blog articles are general information, not professional,
            financial or legal advice; in particular, amateur-status rules vary
            by governing body and must be checked directly.
          </p>

          <h2 className={sectionHeading}>Intellectual property</h2>
          <p className={paragraph}>
            The BuyMeATee name, mark and website content belong to us. You may
            share links to this site freely; please don&apos;t copy the site or
            pass the brand off as your own.
          </p>

          <h2 className={sectionHeading}>Liability</h2>
          <p className={paragraph}>
            This website is provided as-is during the pre-launch phase. To the
            extent the law allows, we accept no liability for decisions made on
            the basis of pre-launch information, and nothing here limits rights
            you have under applicable law that cannot be limited.
          </p>

          <h2 className={sectionHeading}>Changes</h2>
          <p className={paragraph}>
            We may update these terms as the product develops. The date above
            reflects the latest revision; material changes will be flagged on
            this page.
          </p>
        </div>
      </section>
    </>
  );
}
