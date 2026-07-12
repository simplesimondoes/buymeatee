import Image from "next/image";

import { ButtonLink } from "@/components/button-link";
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
          className="object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 via-40% to-white/5" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex max-w-xl flex-col justify-center pb-10 pt-12 sm:min-h-[540px] sm:py-20 lg:min-h-[620px]">
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-forest text-balance sm:text-6xl lg:text-7xl">
            Support the journey.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink/75 sm:text-xl">
            BuyMeATee is where golf fans help creators play more, achieve more
            and chase their goals.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/#early-access" size="lg">
              Find golf creators
            </ButtonLink>
            <ButtonLink href="/#early-access" variant="secondary" size="lg">
              Start your page
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-ink/70">
            Built for golf creators and the people who follow their journey.
          </p>
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
