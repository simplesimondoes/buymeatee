"use client";

import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { useErrorMessage } from "@/components/intl/use-error-message";
import { CoverUploader } from "@/components/profile/cover-uploader";
import { Markdown } from "@/components/markdown";
import { ShareControls } from "@/components/share-controls";
import { ShareMoment } from "@/components/share-moment";
import { MilestoneBadge } from "@/components/ui/milestone-badge";
import { JourneyForm, type PostFormErrors } from "@/components/journey/journey-form";
import type { AppLocale } from "@/i18n/locales";
import { updateShareText } from "@/lib/goals/share";
import { errorDetail, type ErrorDetail } from "@/lib/i18n/errors";
import { formatDate } from "@/lib/i18n/format";
import type { PostInput } from "@/lib/journey/post-schema";
import type { JourneyPostRow } from "@/lib/journey/types";

/**
 * The creator's Journey posts: draft, edit, add an image or milestone, publish
 * or unpublish, and delete. Automatic milestone drafts (from goal progress)
 * appear here too, ready to review and publish. The server owns every rule.
 */

const secondaryButton =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-stone px-3.5 text-xs font-medium text-ink/70 transition-colors hover:border-forest/40 hover:text-forest disabled:opacity-60";

export function JourneyManager({
  initialPosts,
  pageUrl,
}: {
  initialPosts: JourneyPostRow[];
  pageUrl?: string;
}) {
  const t = useTranslations("dashboard");
  const locale = useLocale() as AppLocale;
  const errorMessage = useErrorMessage();
  const [posts, setPosts] = useState(initialPosts);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sharePromptId, setSharePromptId] = useState<string | null>(null);

  function replacePost(updated: JourneyPostRow) {
    setPosts((current) => current.map((p) => (p.id === updated.id ? updated : p)));
  }

  async function handleCreate(input: PostInput) {
    try {
      const response = await fetch("/api/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = (await response.json().catch(() => ({}))) as {
        post?: JourneyPostRow;
        errors?: PostFormErrors;
        error?: ErrorDetail | string;
      };
      if (response.ok && body.post) {
        setPosts((current) => [body.post as JourneyPostRow, ...current]);
        setCreating(false);
        setEditingId((body.post as JourneyPostRow).id);
        return null;
      }
      return { errors: body.errors, error: body.error };
    } catch {
      return { error: errorDetail("generic") };
    }
  }

  async function postAction(
    postId: string,
    payload: Record<string, unknown>,
  ): Promise<{
    post?: JourneyPostRow;
    errors?: PostFormErrors;
    error?: ErrorDetail | string;
  }> {
    try {
      const response = await fetch(`/api/journey/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return (await response.json().catch(() => ({}))) as {
        post?: JourneyPostRow;
        errors?: PostFormErrors;
        error?: ErrorDetail | string;
      };
    } catch {
      return { error: errorDetail("generic") };
    }
  }

  async function handleEdit(postId: string, input: PostInput) {
    const body = await postAction(postId, { action: "edit", ...input });
    if (body.post) {
      replacePost(body.post);
      setEditingId(null);
      return null;
    }
    return { errors: body.errors, error: body.error };
  }

  async function handlePublishToggle(post: JourneyPostRow) {
    setActionError(null);
    setBusyId(post.id);
    const action = post.status === "published" ? "unpublish" : "publish";
    const body = await postAction(post.id, { action });
    setBusyId(null);
    if (body.post) {
      replacePost(body.post);
      setSharePromptId(action === "publish" && pageUrl ? post.id : null);
    } else {
      setActionError(errorMessage(body.error ?? null));
    }
  }

  async function handleDelete(postId: string) {
    setActionError(null);
    setBusyId(postId);
    try {
      const response = await fetch(`/api/journey/${postId}`, { method: "DELETE" });
      if (response.ok) {
        setPosts((current) => current.filter((p) => p.id !== postId));
      } else {
        const body = (await response.json().catch(() => ({}))) as {
          error?: ErrorDetail | string;
        };
        setActionError(errorMessage(body.error ?? null));
      }
    } catch {
      setActionError(errorMessage(null));
    }
    setBusyId(null);
  }

  return (
    <div className="space-y-6">
      {!creating ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setEditingId(null);
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            {t("updates.manager.newUpdate")}
          </button>
        </div>
      ) : null}

      {actionError ? (
        <p role="alert" className="text-sm text-red-800">
          {actionError}
        </p>
      ) : null}

      {creating ? (
        <div className="rounded-3xl border border-stone bg-white p-6">
          <h2 className="mb-4 font-serif text-lg font-semibold text-forest">
            {t("updates.manager.newUpdate")}
          </h2>
          <JourneyForm
            submitLabel={t("updates.manager.saveDraft")}
            onCancel={() => setCreating(false)}
            onSubmit={handleCreate}
          />
        </div>
      ) : null}

      {posts.length === 0 && !creating ? (
        <div className="rounded-3xl border border-stone bg-mist p-6 text-center sm:p-10">
          <h2 className="font-serif text-xl font-semibold text-forest">
            {t("updates.manager.emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
            {t("updates.manager.emptyBody")}
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            {t("updates.manager.writeFirstUpdate")}
          </button>
        </div>
      ) : null}

      <ul className="space-y-4">
        {posts.map((post) => {
          const busy = busyId === post.id;
          const published = post.status === "published";
          const shareTitle = post.title ?? post.milestone_label ?? "";
          return (
            <li
              key={post.id}
              className="rounded-3xl border border-stone bg-white p-5 sm:p-6"
            >
              {editingId === post.id ? (
                <div className="space-y-6">
                  <CoverUploader
                    endpoint={`/api/journey/${post.id}/cover`}
                    initialUrl={post.image_url}
                    label={t("updates.manager.imageLabel")}
                    helpText={t("updates.manager.imageHelp")}
                    aspectClassName="aspect-[16/9]"
                  />
                  <JourneyForm
                    initialTitle={post.title ?? ""}
                    initialBody={post.body}
                    initialVideoUrl={post.video_url ?? ""}
                    initialMilestoneLabel={post.milestone_label ?? ""}
                    goalId={post.goal_id}
                    submitLabel={t("actions.saveChanges")}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(input) => handleEdit(post.id, input)}
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      {post.kind === "milestone" && post.milestone_label ? (
                        <div className="mb-1.5">
                          <MilestoneBadge label={post.milestone_label} size="sm" />
                        </div>
                      ) : null}
                      <h3 className="font-serif text-lg font-semibold text-forest">
                        {post.title ?? post.milestone_label ?? t("updates.manager.untitled")}
                      </h3>
                      <p className="mt-0.5 text-xs text-ink/70">
                        {published && post.published_at
                          ? t("updates.manager.publishedOn", {
                              date: formatDate(post.published_at, locale, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }),
                            })
                          : t("updates.manager.draft")}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        published ? "bg-forest/10 text-forest" : "bg-mist text-ink/70"
                      }`}
                    >
                      {published ? t("updates.manager.published") : t("updates.manager.draft")}
                    </span>
                  </div>

                  <div className="mt-3 line-clamp-3 text-sm text-ink/70">
                    <Markdown source={post.body} />
                  </div>

                  {published && pageUrl && sharePromptId === post.id ? (
                    <div className="mt-4">
                      <ShareMoment
                        key={post.id}
                        heading={t("updates.manager.shareTitle")}
                        message={updateShareText(shareTitle)}
                        url={pageUrl}
                        personalise={{
                          endpoint: "/api/share/personalise",
                          payload: {
                            kind: "update",
                            title: shareTitle,
                            body: post.body,
                            locale,
                          },
                        }}
                        onDismiss={() => setSharePromptId(null)}
                      />
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handlePublishToggle(post)}
                      className={
                        published
                          ? secondaryButton
                          : "inline-flex min-h-9 items-center justify-center rounded-full bg-forest px-4 text-xs font-medium text-white transition-colors hover:bg-forest-dark disabled:opacity-60"
                      }
                    >
                      {published
                        ? t("updates.manager.unpublish")
                        : t("updates.manager.publish")}
                    </button>
                    {published && pageUrl && sharePromptId !== post.id ? (
                      <ShareControls
                        url={pageUrl}
                        text={updateShareText(shareTitle)}
                        buttonLabel={t("updates.manager.shareUpdate")}
                      />
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEditingId(post.id);
                        setCreating(false);
                      }}
                      className={secondaryButton}
                    >
                      {t("actions.edit")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(post.id)}
                      className="inline-flex min-h-9 items-center justify-center rounded-full px-3.5 text-xs font-medium text-red-800/80 transition-colors hover:text-red-800 disabled:opacity-60"
                    >
                      {t("actions.delete")}
                    </button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
