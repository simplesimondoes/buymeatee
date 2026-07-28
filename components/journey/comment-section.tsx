"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Avatar } from "@/components/profile/avatar";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/locales";
import { COMMENT_BODY_MAX_LENGTH, type JourneyCommentRow } from "@/lib/journey/types";
import { formatDate } from "@/lib/i18n/format";

/**
 * Lightweight, flat comments on a Journey post (no threads — spec #1). Reading
 * is open; posting is signed-in only. The post's creator and each comment's
 * author can remove a comment (moderation). Everything reflects the server's
 * answer — RLS is the real gate.
 */
export function CommentSection({
  postId,
  initialComments,
  isSignedIn,
  signInHref,
  currentUserId,
  isOwner,
}: {
  postId: string;
  initialComments: JourneyCommentRow[];
  isSignedIn: boolean;
  signInHref: string;
  currentUserId: string | null;
  isOwner: boolean;
}) {
  const t = useTranslations("journey");
  const locale = useLocale() as AppLocale;
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/journey/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!response.ok) {
        throw new Error("comment failed");
      }
      const payload = (await response.json().catch(() => ({}))) as {
        comment?: JourneyCommentRow;
      };
      if (payload.comment) {
        setComments((current) => [...current, payload.comment as JourneyCommentRow]);
        setDraft("");
      }
    } catch {
      setError(t("commentError"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(commentId: string) {
    const previous = comments;
    setComments((current) => current.filter((c) => c.id !== commentId));
    try {
      const response = await fetch(
        `/api/journey/${postId}/comments/${commentId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error("delete failed");
      }
    } catch {
      setComments(previous);
    }
  }

  return (
    <div className="mt-4 border-t border-stone pt-4">
      {comments.length > 0 ? (
        <ul className="space-y-4">
          {comments.map((comment) => {
            const authorName =
              comment.author?.display_name ||
              comment.author?.username ||
              t("commenterFallback");
            const canDelete =
              isOwner || currentUserId === comment.author_id;
            return (
              <li key={comment.id} className="flex gap-3">
                <Avatar
                  src={comment.author?.avatar_url ?? null}
                  name={authorName}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-semibold text-forest">
                      {authorName}
                    </span>
                    <time
                      dateTime={comment.created_at}
                      className="text-xs text-ink/70"
                    >
                      {formatDate(comment.created_at, locale)}
                    </time>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink/80">
                    {comment.body}
                  </p>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="mt-1 text-xs font-medium text-ink/70 transition-colors hover:text-red-800"
                    >
                      {t("commentDelete")}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="mt-4">
          <label htmlFor={`comment-${postId}`} className="sr-only">
            {t("commentPlaceholder")}
          </label>
          <textarea
            id={`comment-${postId}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, COMMENT_BODY_MAX_LENGTH))}
            placeholder={t("commentPlaceholder")}
            rows={2}
            className="w-full resize-y rounded-2xl border border-stone bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
          />
          {error ? (
            <p role="alert" className="mt-1 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={busy || draft.trim().length === 0}
              className="inline-flex min-h-9 items-center justify-center rounded-full bg-forest px-4 text-sm font-medium text-white transition-colors hover:bg-forest-dark disabled:opacity-60"
            >
              {t("commentSubmit")}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-ink/70">
          <Link
            href={signInHref}
            className="font-medium text-gold-deep hover:text-forest"
          >
            {t("commentSignIn")}
          </Link>
        </p>
      )}
    </div>
  );
}
