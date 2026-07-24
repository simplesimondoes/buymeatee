import { Banknote, Lock, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "@/components/button-link";
import { BuyATeeCard } from "@/components/home/buy-a-tee-card";
import { images } from "@/lib/content/images";

export function Hero() {
  const hero = images.heroJourney;
  return (
    <section className="relative isolate overflow-hidden bg-white">
      {/* Full-bleed image from sm upwards; subjects sit right of centre, so
          a left-to-right white fade keeps the copy readable. */}
      <div aria-hidden="true" className="absolute inset-0 hidden sm:block">
        <Image
          src={hero.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[75%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 via-45% to-white/30" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 pb-10 pt-12 sm:min-h-[560px] sm:py-20 lg:min-h-[640px] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex max-w-xl flex-col justify-center">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-gold-deep">
              Support the journey
            </p>
            <h1 className="font-serif text-5xl font-semibold tracking-tight text-forest text-balance sm:text-6xl lg:text-[4.25rem] lg:leading-[1.02]">
              Get funded to chase your golf goals.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink/75 sm:text-xl">
              Turn the fans who follow your golf into supporters who help fund
              your next round, lesson and competition.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/sign-in" size="lg">
                Start your page
              </ButtonLink>
              <Link
                href="/how-it-works"
                className="inline-flex min-h-11 items-center justify-center px-2 font-medium text-forest underline-offset-4 hover:underline"
              >
                See how it works
              </Link>
            </div>
            <p className="mt-6 text-sm text-ink/70">
              Free to set up · Takes under a minute · Built for golfers
            </p>
            <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-ink/10 pt-5 text-sm text-ink/70">
              <li className="inline-flex items-center gap-2">
                <Lock aria-hidden="true" className="size-4 text-gold-deep" />
                Payments secured by{" "}
                <span className="font-semibold text-ink">Stripe</span>
              </li>
              <li className="inline-flex items-center gap-2">
                <Users aria-hidden="true" className="size-4 text-gold-deep" />
                Your supporters stay yours
              </li>
              <li className="inline-flex items-center gap-2">
                <Banknote aria-hidden="true" className="size-4 text-gold-deep" />
                Fast payouts
              </li>
            </ul>
          </div>
          <div className="lg:justify-self-end">
            <BuyATeeCard />
          </div>
        </div>
      </div>
      {/* Mobile: image below the copy, full width */}
      <div className="sm:hidden">
        <Image
          src={hero.src}
          alt={hero.alt}
          width={hero.width}
          height={hero.height}
          priority
          sizes="100vw"
          className="h-56 w-full object-cover object-[70%_center]"
        />
      </div>
    </section>
  );
}
