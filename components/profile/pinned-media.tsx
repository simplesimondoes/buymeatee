import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import { resolvePinnedMedia } from "@/lib/profile/pinned-media";

/**
 * Renders a creator's pinned media. YouTube/Instagram become hardened,
 * cookie-free embeds (sandboxed iframe, no top-navigation, no forms; src is
 * always a validated youtube-nocookie/instagram embed URL); anything else is
 * a link card that opens in a new tab. Renders nothing for an unusable URL.
 */
export function PinnedMedia({ url }: { url: string | null }) {
  const t = useTranslations("profilePage.pinnedMedia");
  const media = resolvePinnedMedia(url);
  if (!media) {
    return null;
  }

  if (media.kind === "youtube" || media.kind === "instagram") {
    return (
      <section
        aria-label={t("sectionLabel")}
        className="overflow-hidden rounded-3xl border border-stone bg-white"
      >
        <div
          className={
            media.kind === "youtube"
              ? "aspect-video w-full"
              : "mx-auto aspect-[4/5] w-full max-w-md"
          }
        >
          <iframe
            src={media.embedUrl}
            title={t("iframeTitle")}
            className="h-full w-full"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      </section>
    );
  }

  return (
    <a
      href={media.href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label={t("featuredLinkAria", { host: media.host })}
      className="flex items-center justify-between gap-3 rounded-3xl border border-stone bg-white p-5 transition-colors hover:border-forest/40 sm:p-6"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-forest">{t("featuredLink")}</p>
        <p className="mt-0.5 truncate text-sm text-ink/70">{media.host}</p>
      </div>
      <ExternalLink aria-hidden="true" className="h-5 w-5 shrink-0 text-ink/40" />
    </a>
  );
}
