import { ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How BuyMeATee handles personal data: what we collect for accounts, profiles and payments, who processes it, and your rights. Draft pending legal review.",
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
        intro="What we collect, why, who processes it, and the choices you have."
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
              This policy describes what the product actually does, but it has
              not yet been reviewed by a qualified lawyer or data-protection
              adviser. It is not legal advice. The payments, accounts and
              analytics sections in particular still need sign-off from a
              qualified adviser.
            </p>
          </div>

          <p className={paragraph}>Last updated: 24 July 2026.</p>

          <h2 className={sectionHeading}>Who we are</h2>
          <p className={paragraph}>
            BuyMeATee (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is the platform at
            buymeatee.com — a golf-focused way for supporters to back creators
            with a &ldquo;Tee&rdquo;. It is operated by Simon Berriman, a sole
            trader based at Karl-Rothe-Str. 4, 04105 Leipzig, Germany, who is
            the data controller for the personal data described here. For
            payments we work with Stripe, who acts as an independent controller
            for the payment and identity-verification data it collects (see
            &ldquo;Payments&rdquo; below). For any privacy request, contact{" "}
            <a
              href="mailto:hello@buymeatee.com"
              className="font-medium text-gold-deep underline hover:text-forest"
            >
              hello@buymeatee.com
            </a>
            .
          </p>

          <h2 className={sectionHeading}>What we collect</h2>
          <p className={paragraph}>
            <strong className="text-forest">Accounts:</strong> we use passwordless
            sign-in, so we hold your email address and sign-in session data. We
            never store passwords.
          </p>
          <p className={paragraph}>
            <strong className="text-forest">Creator profiles:</strong> the
            details you choose to publish — display name, page link (username),
            bio and About text, photo and cover image, and optional golf details
            (handicap, location, home club, handedness), social links, pinned
            media, goals and posted updates. This information is public by
            design.
          </p>
          <p className={paragraph}>
            <strong className="text-forest">Sending or receiving Tees:</strong>{" "}
            when you send a Tee we handle the amount, an optional message, the
            name shown (or &ldquo;Anonymous&rdquo; if you choose), and — if you
            provide one — an email for your receipt. Card details are entered
            directly with Stripe and never reach our servers. Creators who
            receive Tees complete identity and payout setup with Stripe.
          </p>

          <h2 className={sectionHeading}>Cookies and analytics</h2>
          <p className={paragraph}>
            We use essential cookies to keep you signed in. We also use Google
            Analytics (GA4) to understand, in aggregate, how the site is used;
            this sets analytics cookies. The exact analytics configuration and
            whether a consent banner is required for your region are being
            finalised as part of the legal review, and this section will be
            updated accordingly as that review completes.
          </p>

          <h2 className={sectionHeading}>Why we collect it, and our legal basis</h2>
          <ul className={list}>
            <li>
              To provide the service — accounts, creator pages, goals, updates
              and processing Tees (<em>performance of a contract</em>).
            </li>
            <li>
              To send transactional email — sign-in links, gift receipts and
              creator notifications (<em>contract / legitimate interests</em>).
            </li>
            <li>
              To keep the platform secure, prevent fraud and abuse, and
              understand usage (<em>legitimate interests</em>).
            </li>
            <li>
              To meet legal, tax and anti-money-laundering obligations around
              payments (<em>legal obligation</em>, largely via Stripe).
            </li>
          </ul>
          <p className={paragraph}>
            We do not sell your personal data.
          </p>

          <h2 className={sectionHeading}>Payments (Stripe)</h2>
          <p className={paragraph}>
            Payments run on Stripe using Stripe Connect. When you pay, your card
            details go directly to Stripe — BuyMeATee never sees or stores them.
            Creators receiving Tees onboard with Stripe, which collects the
            identity and bank details it needs to verify them and pay them out;
            Stripe processes that data as an independent controller under its
            own{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-medium text-gold-deep underline hover:text-forest"
            >
              privacy policy
            </a>
            . We store a record of each Tee (amounts, status, references and any
            message) to run the service, show progress and handle refunds and
            disputes.
          </p>

          <h2 className={sectionHeading}>Who processes your data</h2>
          <p className={paragraph}>
            We share personal data only with service providers who help us run
            BuyMeATee:
          </p>
          <ul className={list}>
            <li>
              <strong className="text-forest">Supabase</strong> — database,
              file storage and authentication (hosted in the EU).
            </li>
            <li>
              <strong className="text-forest">Stripe</strong> — payments,
              payouts and identity verification.
            </li>
            <li>
              <strong className="text-forest">Resend</strong> — sending
              transactional email.
            </li>
            <li>
              <strong className="text-forest">Vercel</strong> — website hosting
              and standard server logs.
            </li>
            <li>
              <strong className="text-forest">Google Analytics</strong> —
              aggregate usage analytics.
            </li>
          </ul>
          <p className={paragraph}>
            Some of these providers are based in, or process data in, the United
            States. Where personal data leaves the UK/EEA, it is protected by
            appropriate safeguards such as Standard Contractual Clauses. The
            full processor list and transfer mechanisms will be confirmed in the
            legal review.
          </p>

          <h2 className={sectionHeading}>How long we keep it</h2>
          <p className={paragraph}>
            We keep account, profile and payment records for as long as you have
            an account and as long as we must for legal, tax and accounting
            reasons after that. Public content you post remains visible until you
            remove it or close your account.
          </p>

          <h2 className={sectionHeading}>Your rights</h2>
          <p className={paragraph}>
            Under UK and EU data-protection law you can ask to access, correct,
            delete or export your personal data, object to or restrict certain
            processing, and withdraw consent at any time. You can also complain
            to your data-protection regulator (in the UK, the ICO). Some payment
            and tax records must be retained even if you ask for deletion.
          </p>

          <h2 className={sectionHeading}>Children</h2>
          <p className={paragraph}>
            BuyMeATee is for adults (18+). Junior golfers take part only through
            an appropriate parent or guardian, who is responsible for their
            participation.
          </p>

          <h2 className={sectionHeading}>Changes to this policy</h2>
          <p className={paragraph}>
            We&apos;ll update this policy as the product evolves; the date above
            reflects the latest revision. Material changes will be highlighted
            before they take effect.
          </p>

          <p className={paragraph}>
            See also our{" "}
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
