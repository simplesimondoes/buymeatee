"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * The like control on a Journey post. Signed-in only (spec decision): an
 * anonymous visitor is sent to sign in rather than blocked silently. The count
 * updates optimistically and rolls back if the request fails.
 */
export function LikeButton({
  postId,
  initialLiked,
  initialCount,
  isSignedIn,
  signInHref,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  isSignedIn: boolean;
  signInHref: string;
}) {
  const t = useTranslations("journey");
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!isSignedIn) {
      window.location.href = signInHref;
      return;
    }
    if (busy) return;
    const nextLiked = !liked;
    // Optimistic.
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    setBusy(true);
    try {
      const response = await fetch(`/api/journey/${postId}/like`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("like failed");
      }
      const body = (await response.json().catch(() => ({}))) as {
        liked?: boolean;
      };
      if (typeof body.liked === "boolean" && body.liked !== nextLiked) {
        // Server disagreed (e.g. already liked) — reconcile.
        setLiked(body.liked);
        setCount(initialCount + (body.liked ? 1 : 0) - (initialLiked ? 1 : 0));
      }
    } catch {
      // Roll back.
      setLiked(!nextLiked);
      setCount((c) => c - (nextLiked ? 1 : -1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={liked}
      aria-label={t("likeAria", { count })}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors ${
        liked
          ? "border-gold bg-gold/10 text-gold-deep"
          : "border-stone text-ink/70 hover:border-forest/40 hover:text-forest"
      }`}
    >
      <Heart
        aria-hidden="true"
        className="h-4 w-4"
        fill={liked ? "currentColor" : "none"}
      />
      <span>{count}</span>
    </button>
  );
}
