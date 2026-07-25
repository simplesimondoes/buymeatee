"use client";

import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { useErrorMessage } from "@/components/intl/use-error-message";
import { CoverUploader } from "@/components/profile/cover-uploader";
import { Markdown } from "@/components/markdown";
import { ShareControls } from "@/components/share-controls";
import { ShareMoment } from "@/components/share-moment";
import {
  UpdateForm,
  type UpdateFormErrors,
} from "@/components/updates/update-form";
import type { AppLocale } from "@/i18n/locales";
import { updateShareText } from "@/lib/goals/share";
import { errorDetail, type ErrorDetail } from "@/lib/i18n/errors";
import { formatDate } from "@/lib/i18n/format";
import type { UpdateInput } from "@/lib/updates/update-schema";
import type { CreatorUpdateRow } from "@/lib/updates/types";

/**
 * The creator's project updates: draft, edit, add an image, publish/unpublish
 * and delete. The server owns every rule; this component reflects its answers.
 */

const secondaryButton =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-stone px-3.5 text-xs font-medium text-ink/70 transition-colors hover:border-forest/40 hover:text-forest disabled:opacity-60";

export function UpdateManager({
  initialUpdates,
  pageUrl,
}: {
  initialUpdates: CreatorUpdateRow[];
  /** Absolute public page URL; undefined until a username is claimed. */
  pageUrl?: string;
}) {
  const t = useTranslations("dashboard");
  const locale = useLocale() as AppLocale;
  const errorMessage = useErrorMessage();
  const [updates, setUpdates] = useState(initialUpdates);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // The update whose just-published share moment is showing, if any.
  const [sharePromptId, setSharePromptId] = useState<string | null>(null);

  function replaceUpdate(updated: CreatorUpdateRow) {
    setUpdates((current) =>
      current.map((u) => (u.id === updated.id ? updated : u)),
    );
  }

  async function handleCreate(input: UpdateInput) {
    try {
      const response = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = (await response.json().catch(() => ({}))) as {
        update?: CreatorUpdateRow;
        errors?: UpdateFormErrors;
        error?: ErrorDetail | string;
      };
      if (response.ok && body.update) {
        setUpdates((current) => [body.update as CreatorUpdateRow, ...current]);
        setCreating(false);
        setEditingId((body.update as CreatorUpdateRow).id);
        return null;
      }
      return { errors: body.errors, error: body.error };
    } catch {
      return { error: errorDetail("generic") };
    }
  }

  async function postAction(
    updateId: string,
    payload: Record<string, unknown>,
  ): Promise<{
    update?: CreatorUpdateRow;
    errors?: UpdateFormErrors;
    error?: ErrorDetail | string;
  }> {
    try {
      const response = await fetch(`/api/updates/${updateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return (await response.json().catch(() => ({}))) as {
        update?: CreatorUpdateRow;
        errors?: UpdateFormErrors;
        error?: ErrorDetail | string;
      };
    } catch {
      return { error: errorDetail("generic") };
    }
  }

  async function handleEdit(updateId: string, input: UpdateInput) {
    const body = await postAction(updateId, { action: "edit", ...input });
    if (body.update) {
      replaceUpdate(body.update);
      setEditingId(null);
      return null;
    }
    return { errors: body.errors, error: body.error };
  }

  async function handlePublishToggle(update: CreatorUpdateRow) {
    setActionError(null);
    setBusyId(update.id);
    const action = update.status === "published" ? "unpublish" : "publish";
    const body = await postAction(update.id, { action });
    setBusyId(null);
    if (body.update) {
      replaceUpdate(body.update);
      // Publishing is a share moment; unpublishing clears any stale prompt.
      setSharePromptId(action === "publish" && pageUrl ? update.id : null);
    } else {
      setActionError(errorMessage(body.error ?? null));
    }
  }

  async function handleDelete(updateId: string) {
    setActionError(null);
    setBusyId(updateId);
    try {
      const response = await fetch(`/api/updates/${updateId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setUpdates((current) => current.filter((u) => u.id !== updateId));
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
          <UpdateForm
            submitLabel={t("updates.manager.saveDraft")}
            onCancel={() => setCreating(false)}
            onSubmit={handleCreate}
          />
        </div>
      ) : null}

      {updates.length === 0 && !creating ? (
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
        {updates.map((update) => {
          const busy = busyId === update.id;
          const published = update.status === "published";
          return (
            <li
              key={update.id}
              className="rounded-3xl border border-stone bg-white p-5 sm:p-6"
            >
              {editingId === update.id ? (
                <div className="space-y-6">
                  <CoverUploader
                    endpoint={`/api/updates/${update.id}/cover`}
                    initialUrl={update.image_url}
                    label={t("updates.manager.imageLabel")}
                    helpText={t("updates.manager.imageHelp")}
                    aspectClassName="aspect-[16/9]"
                  />
                  <UpdateForm
                    initialTitle={update.title}
                    initialBody={update.body}
                    submitLabel={t("actions.saveChanges")}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(input) => handleEdit(update.id, input)}
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-forest">
                        {update.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-ink/60">
                        {published && update.published_at
                          ? t("updates.manager.publishedOn", {
                              date: formatDate(update.published_at, locale, {
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
                        published
                          ? "bg-forest/10 text-forest"
                          : "bg-mist text-ink/70"
                      }`}
                    >
                      {published
                        ? t("updates.manager.published")
                        : t("updates.manager.draft")}
                    </span>
                  </div>

                  <div className="mt-3 line-clamp-3 text-sm text-ink/70">
                    <Markdown source={update.body} />
                  </div>

                  {published && pageUrl && sharePromptId === update.id ? (
                    <div className="mt-4">
                      <ShareMoment
                        key={update.id}
                        heading={t("updates.manager.shareTitle")}
                        message={updateShareText(update.title)}
                        url={pageUrl}
                        personalise={{
                          endpoint: "/api/share/personalise",
                          payload: {
                            kind: "update",
                            title: update.title,
                            body: update.body,
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
                      onClick={() => handlePublishToggle(update)}
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
                    {published && pageUrl && sharePromptId !== update.id ? (
                      <ShareControls
                        url={pageUrl}
                        text={updateShareText(update.title)}
                        buttonLabel={t("updates.manager.shareUpdate")}
                      />
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEditingId(update.id);
                        setCreating(false);
                      }}
                      className={secondaryButton}
                    >
                      {t("actions.edit")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(update.id)}
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
