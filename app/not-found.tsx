import type { Metadata } from "next";

import { ButtonLink } from "@/components/button-link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <section className="bg-offwhite">
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:py-32">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
          404
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-forest sm:text-5xl">
          That one&apos;s out of bounds.
        </h1>
        <p className="mt-4 text-lg text-ink/70">
          The page you&apos;re looking for doesn&apos;t exist — let&apos;s get
          you back on the fairway.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/">Back to the homepage</ButtonLink>
          <ButtonLink href="/how-it-works" variant="secondary">
            See how BuyMeATee works
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
