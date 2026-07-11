import Image from "next/image";

import { ButtonLink } from "@/components/button-link";
import { images } from "@/lib/content/images";

export function Hero() {
  const hero = images.heroLinksGolfer;
  return (
    <section className="bg-cream">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:px-8 lg:pb-24 lg:pt-16">
        <div>
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
        <div className="overflow-hidden rounded-3xl">
          <Image
            src={hero.src}
            alt={hero.alt}
            width={hero.width}
            height={hero.height}
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="h-auto w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
