import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CallToAction } from "@/components/call-to-action";
import { PageHeader } from "@/components/page-header";
import { images } from "@/lib/content/images";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Why BuyMeATee exists: golf audiences deserve a more meaningful way to support the players and creators they follow. A tee creates a story a coffee never could.",
  path: "/about",
});

export default function AboutPage() {
  const photo = images.flagAtSunset;
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "About", href: "/about" }]}
        eyebrow="About"
        heading="Why BuyMeATee exists"
      />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <blockquote className="border-l-4 border-gold pl-6 font-serif text-2xl font-medium leading-snug text-forest sm:text-3xl">
            BuyMeATee was created from the belief that golf audiences want a
            more meaningful way to support the players and creators they
            follow. A coffee is quickly forgotten; a tee, a round, a tournament
            entry or a journey creates a story.
          </blockquote>

          <div className="mt-12 space-y-6 text-base leading-relaxed text-ink/80">
            <p>
              Golf has a funding gap hiding in plain sight. The creators
              filming course reviews, the amateurs grinding through qualifying
              seasons, the coaches sharing what they know, the juniors coming
              through — they all carry real costs: green fees, entries, travel,
              equipment, production. Meanwhile, the audiences who love watching
              those journeys have no golf-native way to help beyond a generic
              tip.
            </p>
            <p>
              BuyMeATee closes that gap with support that speaks golf. Instead
              of a coffee, you buy a tee. Instead of a vague donation, you back
              a specific goal — and then you follow it: the progress, the
              setbacks, the milestone when it finally lands. Support becomes
              participation.
            </p>
            <p>
              We&apos;re at the start of our own journey. BuyMeATee is in early
              development, being shaped in the open with the creators and
              supporters who join{" "}
              <Link
                href="/#early-access"
                className="font-medium text-gold-deep underline hover:text-forest"
              >
                early access
              </Link>
              . If that sounds like a round you&apos;d want in on, we&apos;d
              love to have you.
            </p>
          </div>

          <div className="mt-14 overflow-hidden rounded-3xl">
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes="(min-width: 768px) 42rem, 100vw"
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </section>

      <CallToAction
        heading="Help shape BuyMeATee."
        body="Creators and supporters in early access will influence what gets built first."
      />
    </>
  );
}
