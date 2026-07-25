import Image from "next/image";
import { useTranslations } from "next-intl";

import { ExampleBadge } from "@/components/example-badge";
import { ProgressBar } from "@/components/progress-bar";
import { images } from "@/lib/content/images";

/**
 * Fictional creator page preview (labelled Example — ADR-007).
 * Content follows the founder brief: Alex Morgan, Road to Scratch.
 * Display strings live in the `home` namespace under `creatorPreview`.
 */
export function CreatorPreviewCard() {
  const t = useTranslations("home");
  const tContent = useTranslations("content");
  const photo = images.golferDriverSwing;
  const photoAlt = photo.altKey ? tContent(photo.altKey as never) : photo.alt;
  return (
    <article className="overflow-hidden rounded-3xl bg-white text-ink shadow-lg">
      <div className="relative">
        <Image
          src={photo.src}
          alt={photoAlt}
          width={photo.width}
          height={photo.height}
          sizes="(min-width: 1024px) 24rem, 100vw"
          className="h-36 w-full object-cover"
        />
        <ExampleBadge className="absolute left-3 top-3" />
      </div>
      <div className="p-5">
        <h4 className="font-serif text-lg font-semibold text-forest">
          {t("creatorPreview.name")}
        </h4>
        <p className="text-sm text-ink/70">{t("creatorPreview.handicap")}</p>
        <div className="mt-4 rounded-2xl bg-mist p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">
            {t("creatorPreview.currentGoalLabel")}
          </p>
          <p className="mt-1 font-medium text-forest">
            {t("creatorPreview.goalTitle")}
          </p>
          <div className="mt-3 flex items-baseline justify-between text-sm">
            <span className="font-semibold text-forest">
              {t("creatorPreview.amounts")}
            </span>
            <span className="text-ink/70">{t("creatorPreview.percent")}</span>
          </div>
          <ProgressBar
            value={53}
            label={t("creatorPreview.progressLabel")}
            className="mt-2"
          />
        </div>
      </div>
    </article>
  );
}
