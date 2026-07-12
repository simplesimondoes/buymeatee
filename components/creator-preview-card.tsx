import Image from "next/image";

import { ExampleBadge } from "@/components/example-badge";
import { ProgressBar } from "@/components/progress-bar";
import { images } from "@/lib/content/images";

/**
 * Fictional creator page preview (labelled Example — ADR-007).
 * Content follows the founder brief: Alex Morgan, Road to Scratch.
 */
export function CreatorPreviewCard() {
  const photo = images.golferDriverSwing;
  return (
    <article className="overflow-hidden rounded-3xl bg-white text-ink shadow-lg">
      <div className="relative">
        <Image
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes="(min-width: 1024px) 24rem, 100vw"
          className="h-36 w-full object-cover"
        />
        <ExampleBadge className="absolute left-3 top-3" />
      </div>
      <div className="p-5">
        <h4 className="font-serif text-lg font-semibold text-forest">
          Alex Morgan
        </h4>
        <p className="text-sm text-ink/70">7.8 handicap</p>
        <div className="mt-4 rounded-2xl bg-mist p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">
            Current goal
          </p>
          <p className="mt-1 font-medium text-forest">Road to Scratch</p>
          <div className="mt-3 flex items-baseline justify-between text-sm">
            <span className="font-semibold text-forest">£640 of £1,200</span>
            <span className="text-ink/70">53%</span>
          </div>
          <ProgressBar
            value={53}
            label="Progress towards Road to Scratch (example)"
            className="mt-2"
          />
        </div>
      </div>
    </article>
  );
}
