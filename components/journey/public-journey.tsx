import { useLocale, useTranslations } from "next-intl";

import { CommentSection } from "@/components/journey/comment-section";
import { LikeButton } from "@/components/journey/like-button";
import { Markdown } from "@/components/markdown";
import { ShareControls } from "@/components/share-controls";
import { MilestoneBadge } from "@/components/ui/milestone-badge";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/locales";
import { updateShareText } from "@/lib/goals/share";
import { formatDate } from "@/lib/i18n/format";
import { resolveJourneyVideo } from "@/lib/journey/video";
import type { JourneyFeedPost } from "@/lib/journey/types";

/**
 * A creator's published Journey as supporters see it — a reverse-chronological
 * feed of real progress: photos, milestone badges, an optional video, likes and
 * lightweight comments. Server-rendered; markdown bodies go through the
 * sanitising <Markdown> (ADR-014) and interactions are small client islands.
 */
export function PublicJourney({
  posts,
  creatorName,
  isOwner,
  isSignedIn,
  currentUserId,
  signInHref,
  pageUrl,
}: {
  posts: JourneyFeedPost[];
  creatorName: string;
  isOwner: boolean;
  isSignedIn: boolean;
  currentUserId: string | null;
  signInHref: string;
  pageUrl: string;
}) {
  const t = useTranslations("journey");
  const locale = useLocale() as AppLocale;

  if (posts.length === 0) {
    if (!isOwner) {
      return null;
    }
    return (
      <section
        aria-label={t("sectionLabel")}
        className="rounded-3xl border border-dashed border-stone bg-mist p-6 text-center"
      >
        <h2 className="font-serif text-lg font-semibold text-forest">
          {t("emptyOwnerHeading")}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
          {t("emptyOwnerBody")}
        </p>
        <Link
          href="/dashboard/journey"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-forest/30 px-5 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-forest/5"
        >
          {t("writeFirst")}
        </Link>
      </section>
    );
  }

  return (
    <section aria-label={t("sectionLabel")} className="space-y-5">
      <h2 className="font-serif text-xl font-semibold text-forest">
        {t("heading", { name: creatorName })}
      </h2>
      <ol className="space-y-6">
        {posts.map((post) => {
          const video = resolveJourneyVideo(post.video_url);
          const images =
            post.media.length > 0
              ? post.media.map((m) => m.url)
              : post.image_url
                ? [post.image_url]
                : [];
          return (
            <li
              key={post.id}
              className="overflow-hidden rounded-3xl border border-stone bg-white shadow-[0_1px_2px_rgba(7,62,46,0.04)]"
            >
              {images.length > 0 ? (
                images.length === 1 ? (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-mist">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={images[0]}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex snap-x snap-mandatory gap-1 overflow-x-auto">
                    {images.map((src, index) => (
                      <div
                        key={index}
                        className="aspect-[4/3] w-4/5 shrink-0 snap-start overflow-hidden bg-mist sm:w-3/5"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )
              ) : null}

              {video ? (
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={video.embedUrl}
                    title={post.title ?? t("videoTitle")}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                    loading="lazy"
                  />
                </div>
              ) : null}

              <article className="p-5 sm:p-6">
                {post.kind === "milestone" && post.milestone_label ? (
                  <div className="mb-2">
                    <MilestoneBadge label={post.milestone_label} />
                  </div>
                ) : null}
                <time
                  dateTime={post.published_at ?? undefined}
                  className="text-xs font-medium uppercase tracking-wide text-gold-deep"
                >
                  {post.published_at ? formatDate(post.published_at, locale) : ""}
                </time>
                {post.title ? (
                  <h3 className="mt-1 font-serif text-lg font-semibold text-forest">
                    {post.title}
                  </h3>
                ) : null}
                <div className="mt-2">
                  <Markdown source={post.body} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <LikeButton
                    postId={post.id}
                    initialLiked={post.viewerHasLiked}
                    initialCount={post.like_count}
                    isSignedIn={isSignedIn}
                    signInHref={signInHref}
                  />
                  <ShareControls
                    url={pageUrl}
                    text={updateShareText(post.title ?? creatorName)}
                    buttonLabel={t("share")}
                    size="sm"
                  />
                </div>

                <CommentSection
                  postId={post.id}
                  initialComments={post.comments}
                  isSignedIn={isSignedIn}
                  signInHref={signInHref}
                  currentUserId={currentUserId}
                  isOwner={isOwner}
                />
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
