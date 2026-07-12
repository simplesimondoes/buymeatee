import { ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How BuyMeATee handles personal data during early access: what the site collects, why, and your rights. Pre-launch draft pending legal review.",
  path: "/privacy",
});

const sectionHeading =
  "mt-10 font-serif text-2xl font-semibold tracking-tight text-forest";
const paragraph = "mt-4 text-base leading-relaxed text-ink/80";
const list =
  "mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-ink/80 marker:text-gold-deep";

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Privacy", href: "/privacy" }]}
        eyebrow="Legal"
        heading="Privacy Policy"
        intro="What this website collects, why, and the choices you have."
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
              This pre-launch privacy policy describes what the site actually
              does today. It has not yet been reviewed by a lawyer and will be
              finalised before the full product launches.
            </p>
          </div>

          <p className={paragraph}>Last updated: 11 July 2026.</p>

          <h2 className={sectionHeading}>Who we are</h2>
          <p className={paragraph}>
            BuyMeATee (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the website
            at buymeatee.com. BuyMeATee is a pre-launch product: this website
            presents the concept and lets you register early-access interest.
            There are no user accounts and no payments.
          </p>

          <h2 className={sectionHeading}>What we collect</h2>
          <p className={paragraph}>
            The only personal data this website collects is what you choose to
            submit through the early-access form:
          </p>
          <ul className={list}>
            <li>Your name</li>
            <li>Your email address</li>
            <li>
              Whether you&apos;re interested as a creator or a supporter
            </li>
            <li>Your country</li>
            <li>Optionally, a creator profile or social link</li>
            <li>
              Optionally, your answer to &ldquo;What would you use BuyMeATee
              for?&rdquo;
            </li>
          </ul>
          <p className={paragraph}>
            We deliberately keep this minimal. We do not collect anything else
            through the form, and we never ask for payment details.
          </p>

          <h2 className={sectionHeading}>Cookies and tracking</h2>
          <p className={paragraph}>
            This website does not set marketing or analytics cookies and does
            not run third-party tracking scripts. That is why there is no
            cookie banner. If we later add privacy-friendly analytics, this
            policy will be updated first.
          </p>

          <h2 className={sectionHeading}>Why we collect it</h2>
          <p className={paragraph}>We use early-access details to:</p>
          <ul className={list}>
            <li>Contact you about BuyMeATee early access and launch news</li>
            <li>
              Understand which kinds of creators and supporters are interested,
              so we build the right product
            </li>
          </ul>
          <p className={paragraph}>
            The legal basis is your consent, given when you tick the consent
            box on the form. We will not sell your details or use them for
            unrelated marketing.
          </p>

          <h2 className={sectionHeading}>Where your data goes</h2>
          <p className={paragraph}>
            Form submissions are sent to the sign-up service we have configured
            at the time of your submission, and the website is hosted on
            Vercel, whose infrastructure processes requests to serve the site
            (including standard server logs). If no sign-up service is
            connected, the form tells you so honestly and your details are not
            stored at all. The specific provider will be named in this policy
            once the choice is final.
          </p>

          <h2 className={sectionHeading}>How long we keep it</h2>
          <p className={paragraph}>
            We keep early-access registrations until BuyMeATee launches and the
            early-access programme ends, or until you ask us to remove yours —
            whichever comes first.
          </p>

          <h2 className={sectionHeading}>Your rights</h2>
          <p className={paragraph}>
            Under UK and EU data-protection law you can ask us to access,
            correct or delete the personal data we hold about you, and you can
            withdraw your consent at any time — every email we send will
            include a way to do so.
          </p>

          <h2 className={sectionHeading}>Children</h2>
          <p className={paragraph}>
            This website and the early-access programme are intended for
            adults. Junior golfers will take part in BuyMeATee only through an
            appropriate parent or guardian.
          </p>

          <h2 className={sectionHeading}>Changes to this policy</h2>
          <p className={paragraph}>
            As BuyMeATee develops — particularly when payments and accounts are
            introduced — this policy will change substantially and will be
            reviewed legally before launch. The date at the top reflects the
            latest revision.
          </p>

          <p className={paragraph}>
            Questions about privacy? See also our{" "}
            <Link
              href="/terms"
              className="font-medium text-gold-deep underline hover:text-forest"
            >
              terms
            </Link>{" "}
            and{" "}
            <Link
              href="/faq"
              className="font-medium text-gold-deep underline hover:text-forest"
            >
              FAQ
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
