"use client";

import { Check, Copy, RefreshCw, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { useErrorMessage } from "@/components/intl/use-error-message";
import { BlueskyLogo, XLogo } from "@/components/share-controls";
import type { AppLocale } from "@/i18n/locales";
import { audiences } from "@/lib/content/audiences";
import { errorDetail, type ErrorDetail } from "@/lib/i18n/errors";
import { formatDate } from "@/lib/i18n/format";
import {
  canPerform,
  SOCIAL_IMAGE_TYPES,
  SOCIAL_PILLARS,
  SOCIAL_STATUSES,
  type SocialDraftRow,
  type SocialImageType,
  type SocialPillar,
  type SocialStatus,
} from "@/lib/social-studio/types";

/**
 * The Social Content Studio manager (ADR-023): rolling calendar, filters,
 * per-draft editing and the manual-publish workflow. The server owns every
 * rule; this component reflects its answers. Phase 1 publishes nothing — the
 * founder copies the platform text out and marks the draft published.
 */

const statusChipClasses: Record<SocialStatus, string> = {
  draft: "bg-mist text-ink/70",
  ai_generated: "bg-forest/10 text-forest",
  edited: "bg-stone/60 text-ink/70",
  approved: "bg-gold/20 text-gold-deep",
  published: "bg-forest text-white",
};

const secondaryButton =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-stone px-3.5 text-xs font-medium text-ink/70 transition-colors hover:border-forest/40 hover:text-forest disabled:opacity-60";
const primaryButton =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-forest px-4 text-xs font-medium text-white transition-colors hover:bg-forest-dark disabled:opacity-60";

type Filters = {
  status: SocialStatus | "all";
  pillar: SocialPillar | "all";
  audience: string | "all";
  image: SocialImageType | "all";
};

export function SocialStudio({
  initialDrafts,
  aiConfigured,
}: {
  initialDrafts: SocialDraftRow[];
  aiConfigured: boolean;
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as AppLocale;
  const errorMessage = useErrorMessage();
  const [drafts, setDrafts] = useState(initialDrafts);
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    pillar: "all",
    audience: "all",
    image: "all",
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [seeding, setSeeding] = useState<number | null>(null);
  const [seedSummary, setSeedSummary] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      drafts.filter(
        (draft) =>
          (filters.status === "all" || draft.status === filters.status) &&
          (filters.pillar === "all" || draft.pillar === filters.pillar) &&
          (filters.audience === "all" || draft.audience === filters.audience) &&
          (filters.image === "all" || draft.image_type === filters.image),
      ),
    [drafts, filters],
  );

  const byDay = useMemo(() => {
    const groups = new Map<string, SocialDraftRow[]>();
    for (const draft of filtered) {
      const day = draft.scheduled_for.slice(0, 10);
      groups.set(day, [...(groups.get(day) ?? []), draft]);
    }
    return [...groups.entries()];
  }, [filtered]);

  function replaceDraft(updated: SocialDraftRow) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === updated.id ? updated : draft)),
    );
  }

  async function postAction(
    draftId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    setActionError(null);
    setBusyId(draftId);
    try {
      const response = await fetch(`/api/admin/social/${draftId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as {
        draft?: SocialDraftRow;
        error?: ErrorDetail | string;
      };
      if (response.ok && body.draft) {
        if (payload.action === "duplicate") {
          setDrafts((current) =>
            [...current, body.draft as SocialDraftRow].sort((a, b) =>
              a.scheduled_for.localeCompare(b.scheduled_for),
            ),
          );
        } else {
          replaceDraft(body.draft);
        }
      } else {
        setActionError(errorMessage(body.error ?? errorDetail("generic")));
      }
    } catch {
      setActionError(errorMessage(null));
    }
    setBusyId(null);
  }

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setActionError(errorMessage(null));
    }
  }

  async function seedCalendar() {
    setActionError(null);
    setSeedSummary(null);
    let created = 0;
    for (let week = 0; week < 4; week += 1) {
      setSeeding(week + 1);
      try {
        const response = await fetch("/api/admin/social/seed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offsetDays: week * 7, days: 7 }),
        });
        const body = (await response.json().catch(() => ({}))) as {
          created?: number;
        };
        if (!response.ok) {
          setActionError(errorMessage(errorDetail("generic")));
          break;
        }
        created += body.created ?? 0;
      } catch {
        setActionError(errorMessage(null));
        break;
      }
    }
    setSeeding(null);
    setSeedSummary(t("social.seed.done", { created }));
    // Seeding writes rows server-side; a reload re-fetches the calendar.
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["status", ["all", ...SOCIAL_STATUSES], "social.status"],
            ["pillar", ["all", ...SOCIAL_PILLARS], "social.pillars"],
            [
              "audience",
              ["all", ...audiences.map((audience) => audience.slug)],
              null,
            ],
            ["image", ["all", ...SOCIAL_IMAGE_TYPES], "social.image"],
          ] as const
        ).map(([key, options, labelNs]) => (
          <label key={key} className="flex items-center gap-1.5 text-xs text-ink/70">
            {t(`social.filters.${key}`)}
            <select
              value={filters[key]}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              className="min-h-9 rounded-full border border-stone bg-white px-3 text-xs font-medium text-ink/80"
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option === "all"
                    ? t("social.filters.all")
                    : labelNs
                      ? t(`${labelNs}.${option}` as never)
                      : option.replace(/-/g, " ")}
                </option>
              ))}
            </select>
          </label>
        ))}
        <span className="ml-auto flex items-center gap-2">
          {!aiConfigured ? (
            <span className="text-xs text-ink/70">
              {t("social.seed.notConfigured")}
            </span>
          ) : null}
          <button
            type="button"
            disabled={!aiConfigured || seeding !== null}
            onClick={seedCalendar}
            className={primaryButton}
          >
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
            {seeding !== null
              ? t("social.seed.progress", { week: seeding })
              : t("social.seed.button")}
          </button>
        </span>
      </div>

      {actionError ? (
        <p role="alert" className="text-sm text-red-800">
          {actionError}
        </p>
      ) : null}
      {seedSummary ? (
        <p role="status" className="text-sm text-forest">
          {seedSummary}
        </p>
      ) : null}

      {byDay.length === 0 ? (
        <div className="rounded-3xl border border-stone bg-mist p-8 text-center text-sm text-ink/70">
          {t("social.page.empty")}
        </div>
      ) : null}

      <ol className="space-y-6">
        {byDay.map(([day, dayDrafts]) => (
          <li key={day}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gold-deep">
              {formatDate(`${day}T00:00:00Z`, locale, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </h2>
            <ul className="mt-2 space-y-3">
              {dayDrafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  open={openId === draft.id}
                  busy={busyId === draft.id}
                  copied={copied}
                  onToggle={() =>
                    setOpenId((current) =>
                      current === draft.id ? null : draft.id,
                    )
                  }
                  onAction={postAction}
                  onCopy={copyText}
                />
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DraftCard({
  draft,
  open,
  busy,
  copied,
  onToggle,
  onAction,
  onCopy,
}: {
  draft: SocialDraftRow;
  open: boolean;
  busy: boolean;
  copied: string | null;
  onToggle: () => void;
  onAction: (draftId: string, payload: Record<string, unknown>) => Promise<void>;
  onCopy: (key: string, text: string) => Promise<void>;
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as AppLocale;
  const [xCopy, setXCopy] = useState(draft.x_copy);
  const [blueskyCopy, setBlueskyCopy] = useState(draft.bluesky_copy);
  const dirty = xCopy !== draft.x_copy || blueskyCopy !== draft.bluesky_copy;

  // Server responses are the source of truth for copy text.
  const [lastSynced, setLastSynced] = useState(draft.updated_at);
  if (lastSynced !== draft.updated_at) {
    setLastSynced(draft.updated_at);
    setXCopy(draft.x_copy);
    setBlueskyCopy(draft.bluesky_copy);
  }

  return (
    <li className="rounded-3xl border border-stone bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-2 p-4 text-left"
      >
        <span className="text-xs font-medium text-ink/70">
          {t(`social.slot.${draft.slot}`)}
        </span>
        <span className="font-medium text-forest">
          {t(`social.pillars.${draft.pillar}`)}
        </span>
        {draft.audience ? (
          <span className="text-xs text-ink/70">
            {draft.audience.replace(/-/g, " ")}
          </span>
        ) : null}
        <span className="ml-auto flex items-center gap-2">
          <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs text-ink/70">
            {t(`social.image.${draft.image_type}`)}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusChipClasses[draft.status]}`}
          >
            {t(`social.status.${draft.status}`)}
          </span>
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-stone p-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink/70">
                {t("social.detail.objective")}
              </dt>
              <dd className="mt-0.5 text-ink/80">{draft.objective || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink/70">
                {t("social.detail.cta")}
              </dt>
              <dd className="mt-0.5 text-ink/80">{draft.cta || "—"}</dd>
            </div>
          </dl>

          {(["x", "bluesky"] as const).map((network) => {
            const value = network === "x" ? xCopy : blueskyCopy;
            const max = network === "x" ? 280 : 300;
            return (
              <div key={network}>
                <div className="flex items-baseline justify-between">
                  <label
                    htmlFor={`${draft.id}-${network}`}
                    className="text-xs font-medium uppercase tracking-wide text-ink/70"
                  >
                    {t(`social.detail.${network}Copy`)}
                  </label>
                  <span className="text-xs text-ink/70">
                    {t("social.detail.chars", { count: value.length, max })}
                  </span>
                </div>
                <textarea
                  id={`${draft.id}-${network}`}
                  value={value}
                  maxLength={max}
                  rows={3}
                  onChange={(event) =>
                    network === "x"
                      ? setXCopy(event.target.value)
                      : setBlueskyCopy(event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-stone bg-white p-3 text-sm leading-relaxed text-ink/90 focus:border-forest/50 focus:outline-none"
                />
              </div>
            );
          })}

          {draft.image_type === "lifestyle" && draft.image_prompt ? (
            <p className="rounded-2xl bg-mist p-3 text-sm text-ink/75">
              <span className="block text-xs font-medium uppercase tracking-wide text-ink/70">
                {t("social.detail.imagePrompt")}
              </span>
              {draft.image_prompt}
            </p>
          ) : null}
          {draft.image_type === "branded" && draft.branded_text ? (
            <p className="rounded-2xl bg-forest p-4 text-center font-serif text-lg text-gold">
              {draft.branded_text}
            </p>
          ) : null}
          {draft.published_at ? (
            <p className="text-xs text-ink/70">
              {t("social.detail.publishedAt", {
                date: formatDate(draft.published_at, locale, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
              })}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {/* Direct posting via web intents (no APIs, ADR-016/023): the
                compose window opens pre-filled with the CURRENT textarea
                text; the founder reviews and sends it themselves. */}
            <a
              href={`https://twitter.com/intent/tweet?${new URLSearchParams({ text: xCopy }).toString()}`}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryButton}
            >
              <XLogo className="h-3.5 w-3.5" />
              {t("social.actions.post_x")}
            </a>
            <a
              href={`https://bsky.app/intent/compose?text=${encodeURIComponent(blueskyCopy)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryButton}
            >
              <BlueskyLogo className="h-3.5 w-3.5" />
              {t("social.actions.post_bluesky")}
            </a>
            <button
              type="button"
              disabled={busy || !dirty}
              onClick={() =>
                onAction(draft.id, { action: "edit", xCopy, blueskyCopy })
              }
              className={primaryButton}
            >
              {t("social.actions.save")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction(draft.id, { action: "regenerateCopy" })}
              className={secondaryButton}
            >
              <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
              {t("social.actions.regenerateCopy")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction(draft.id, { action: "regenerateImage" })}
              className={secondaryButton}
            >
              <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
              {t("social.actions.regenerateImage")}
            </button>
            {(["x", "bluesky"] as const).map((network) => {
              const key = `${draft.id}-${network}`;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    onCopy(key, network === "x" ? xCopy : blueskyCopy)
                  }
                  className={secondaryButton}
                >
                  {copied === key ? (
                    <Check aria-hidden="true" className="h-3.5 w-3.5 text-forest" />
                  ) : (
                    <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  {copied === key
                    ? t("social.actions.copied")
                    : t(`social.actions.copy_${network}`)}
                </button>
              );
            })}
            {canPerform("approve", draft.status) ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction(draft.id, { action: "approve" })}
                className={secondaryButton}
              >
                {t("social.actions.approve")}
              </button>
            ) : null}
            {canPerform("publish", draft.status) ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction(draft.id, { action: "publish" })}
                className={primaryButton}
              >
                {t("social.actions.publish")}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction(draft.id, { action: "duplicate" })}
              className={secondaryButton}
            >
              {t("social.actions.duplicate")}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
