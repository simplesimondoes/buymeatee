"use client";

import { Check, Copy, ImageDown, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ShareControls } from "@/components/share-controls";
import type { ShareMessage } from "@/lib/goals/share";

/**
 * A "share moment": a celebratory card shown right after something worth
 * sharing happened (page went live, update published, item funded, Tee sent).
 * The suggested post is visible and editable — nothing is ever posted on the
 * user's behalf (ADR-016/ADR-021); every button opens a compose window or
 * copies text for them to send themselves.
 *
 * Needs the `gifts` message namespace. If the same card can represent
 * different subjects over its lifetime, key it by subject (e.g.
 * `key={update.id}`) so the editable text resets.
 */
export function ShareMoment({
  url,
  message,
  heading,
  body,
  downloadImageHref,
  personalise,
  onDismiss,
}: {
  /** Absolute, canonical URL to share (e.g. https://buymeatee.com/t/name). */
  url: string;
  /** Suggested post copy; editable by the user before sharing. */
  message: ShareMessage | string;
  /** Already-translated heading, provided by the surface that owns the moment. */
  heading: string;
  /** Optional already-translated supporting line. */
  body?: string;
  /** Same-origin image URL offered as a download (for Instagram-style flows). */
  downloadImageHref?: string;
  /**
   * Optional AI personalisation (ADR-021). Only offered on authed creator
   * surfaces; the endpoint falls back honestly when not configured.
   */
  personalise?: { endpoint: string; payload: Record<string, unknown> };
  onDismiss?: () => void;
}) {
  const tShare = useTranslations("gifts.share");
  const t = useTranslations("gifts.share.moment");
  const initialText =
    typeof message === "string"
      ? message
      : tShare(message.key as never, message.params as never);
  const [text, setText] = useState(initialText);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [aiState, setAiState] = useState<
    "idle" | "busy" | "failed" | "unavailable"
  >("idle");

  async function copyCaption() {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  }

  async function personaliseCopy() {
    if (!personalise || aiState === "busy") {
      return;
    }
    setAiState("busy");
    try {
      const response = await fetch(personalise.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personalise.payload),
      });
      if (response.status === 503) {
        setAiState("unavailable");
        return;
      }
      const body = (await response.json().catch(() => ({}))) as {
        text?: string;
      };
      if (response.ok && typeof body.text === "string" && body.text.trim()) {
        setText(body.text.trim());
        setAiState("idle");
        return;
      }
      setAiState("failed");
    } catch {
      setAiState("failed");
    }
  }

  const smallButton =
    "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-stone bg-white px-3.5 text-xs font-medium text-ink/70 transition-colors hover:border-forest/40 hover:text-forest disabled:opacity-60";

  return (
    <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gold-deep">{heading}</p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t("dismiss")}
            className="rounded-full p-1 text-ink/70 transition-colors hover:bg-gold/20 hover:text-ink/80"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {body ? (
        <p className="mt-1 text-sm leading-relaxed text-ink/70">{body}</p>
      ) : null}

      <label className="mt-3 block">
        <span className="text-xs font-medium text-ink/70">
          {t("suggestedLabel")}
        </span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          className="mt-1.5 w-full rounded-xl border border-stone bg-white p-3 text-sm leading-relaxed text-ink/90 focus:border-forest/50 focus:outline-none"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ShareControls url={url} text={text} />
        <button type="button" onClick={copyCaption} className={smallButton}>
          {copied ? (
            <Check aria-hidden="true" className="h-3.5 w-3.5 text-forest" />
          ) : (
            <Copy aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          {copied ? t("captionCopied") : t("copyCaption")}
        </button>
        {downloadImageHref ? (
          <a href={downloadImageHref} download className={smallButton}>
            <ImageDown aria-hidden="true" className="h-3.5 w-3.5" />
            {t("downloadImage")}
          </a>
        ) : null}
        {personalise && aiState !== "unavailable" ? (
          <button
            type="button"
            onClick={personaliseCopy}
            disabled={aiState === "busy"}
            className={smallButton}
          >
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
            {aiState === "busy" ? t("personalising") : t("personalise")}
          </button>
        ) : null}
      </div>

      {copyFailed ? (
        <p className="mt-2 text-xs text-ink/70">{t("copyCaptionFailed")}</p>
      ) : null}
      {aiState === "failed" ? (
        <p className="mt-2 text-xs text-ink/70">{t("personaliseFailed")}</p>
      ) : null}
      {aiState === "unavailable" ? (
        <p className="mt-2 text-xs text-ink/70">{t("personaliseUnavailable")}</p>
      ) : null}
      <span aria-live="polite" className="sr-only">
        {copied ? t("captionCopiedAnnouncement") : ""}
      </span>
    </div>
  );
}
