import { ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use",
  description:
    "The terms for using BuyMeATee — accounts, creator pages, sending and receiving Tees, fees and acceptable use. Draft pending legal review.",
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
        intro="The ground rules for using BuyMeATee."
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
              These terms are written in plain language and have not yet been
              reviewed by a qualified lawyer. They are not legal advice. Because
              BuyMeATee now handles real payments, they must be reviewed —
              alongside the Stripe Connected Account Agreement — before launch.
            </p>
          </div>

          <p className={paragraph}>Last updated: 24 July 2026.</p>

          <h2 className={sectionHeading}>What BuyMeATee is</h2>
          <p className={paragraph}>
            BuyMeATee is a golf-focused platform where supporters back creators
            with a &ldquo;Tee&rdquo; — a voluntary contribution toward a
            creator&apos;s golf journey and goals. We provide the platform and
            process payments through Stripe; we are not a bank and do not hold
            your money. By using BuyMeATee you agree to these terms.
          </p>

          <h2 className={sectionHeading}>Who operates BuyMeATee</h2>
          <p className={paragraph}>
            BuyMeATee is operated by Simon Berriman, a sole trader (freelance),
            Karl-Rothe-Str. 4, 04105 Leipzig, Germany. Contact:{" "}
            <a
              href="mailto:hello@buymeatee.com"
              className="font-medium text-gold-deep underline hover:text-forest"
            >
              hello@buymeatee.com
            </a>
            , +49 15207075439. (German law may require these details to be
            presented as a separate Impressum — to be confirmed in the legal
            review.)
          </p>

          <h2 className={sectionHeading}>Your account</h2>
          <ul className={list}>
            <li>You must be at least 18 to create an account.</li>
            <li>
              Sign-in is by one-time email link. Keep access to your email
              secure — anyone with it can access your account.
            </li>
            <li>
              You&apos;re responsible for the activity on your account and for
              the accuracy of what you publish.
            </li>
          </ul>

          <h2 className={sectionHeading}>Sending a Tee (supporters)</h2>
          <ul className={list}>
            <li>
              A Tee is voluntary support, not the purchase of a product or
              service, and not an investment, loan or donation to a registered
              charity. You receive no goods and no financial return.
            </li>
            <li>
              Amounts shown at checkout include the creator&apos;s Tee plus the
              BuyMeATee platform fee and estimated payment-handling costs. The
              total is confirmed before you pay.
            </li>
            <li>
              Payment is taken by Stripe. Refunds are at the platform&apos;s or
              creator&apos;s discretion and are handled through Stripe; contact
              us if there&apos;s a problem with a Tee.
            </li>
            <li>
              Don&apos;t use BuyMeATee for money laundering, fraud, or to send
              funds you&apos;re not entitled to send.
            </li>
          </ul>

          <h2 className={sectionHeading}>Receiving Tees (creators)</h2>
          <ul className={list}>
            <li>
              To receive Tees you must complete onboarding with Stripe and
              accept the{" "}
              <a
                href="https://stripe.com/legal/connect-account"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-medium text-gold-deep underline hover:text-forest"
              >
                Stripe Connected Account Agreement
              </a>
              . Payouts, timing and identity checks are governed by Stripe.
            </li>
            <li>
              BuyMeATee retains a platform fee plus payment-handling costs from
              each Tee; the rest is transferred to your connected account. Fees
              are shown before a supporter pays and may change with notice.
            </li>
            <li>
              You are responsible for any tax you owe on support you receive.
              BuyMeATee does not provide tax advice.
            </li>
            <li>
              Describe your goals honestly. Support is given on trust; using
              goals or updates to mislead supporters is grounds for removal.
            </li>
          </ul>

          <div
            role="note"
            className="mt-6 rounded-2xl border border-gold/40 bg-mist p-5 text-sm leading-relaxed text-ink/80"
          >
            <strong className="text-forest">Amateur status — read this.</strong>{" "}
            Accepting money or support can affect your amateur status under the
            Rules of Amateur Status (R&amp;A / USGA) and the rules of your
            governing body, club, college or tour. These rules vary and change.
            It is your responsibility to check your own position before
            receiving Tees — BuyMeATee cannot advise on your amateur status.
          </div>

          <h2 className={sectionHeading}>Your content</h2>
          <p className={paragraph}>
            You keep ownership of what you post — your profile, goals, updates,
            images and links. You grant BuyMeATee a licence to host and display
            that content to operate the platform. You must have the right to
            post it, and it must not be unlawful, infringing, misleading,
            hateful or otherwise prohibited. Pinned media links to third-party
            platforms (e.g. YouTube, Instagram) are subject to those
            platforms&apos; own terms.
          </p>

          <h2 className={sectionHeading}>Acceptable use and moderation</h2>
          <p className={paragraph}>
            Don&apos;t use BuyMeATee to break the law, infringe others&apos;
            rights, deceive supporters, or abuse the service. We may review,
            remove or unpublish content and suspend or close accounts that
            breach these terms or put supporters, creators or the platform at
            risk.
          </p>

          <h2 className={sectionHeading}>Content and accuracy</h2>
          <p className={paragraph}>
            We work to keep BuyMeATee honest: goal progress reflects only
            confirmed payments, never numbers typed in. Blog articles are
            general information, not professional, financial or legal advice.
          </p>

          <h2 className={sectionHeading}>Intellectual property</h2>
          <p className={paragraph}>
            The BuyMeATee name, mark and platform belong to us. You may share
            links freely; please don&apos;t copy the platform or pass the brand
            off as your own.
          </p>

          <h2 className={sectionHeading}>Disclaimers and liability</h2>
          <p className={paragraph}>
            BuyMeATee is provided as-is. We facilitate support between
            supporters and creators but don&apos;t guarantee any creator&apos;s
            conduct, goals or outcomes. To the extent the law allows, we accept
            no liability for the relationship between supporters and creators or
            for decisions made using the platform, and nothing here limits
            rights you have under applicable law that cannot be limited.
          </p>

          <h2 className={sectionHeading}>Changes</h2>
          <p className={paragraph}>
            We may update these terms as the product develops. The date above
            reflects the latest revision; material changes will be flagged.
          </p>

          <p className={paragraph}>
            See also our{" "}
            <Link
              href="/privacy"
              className="font-medium text-gold-deep underline hover:text-forest"
            >
              privacy policy
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
