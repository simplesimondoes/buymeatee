"use client";

import { ImagePlus, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { useErrorMessage } from "@/components/intl/use-error-message";
import { errorDetail, type ErrorDetail } from "@/lib/i18n/errors";
import { AVATAR_ALLOWED_TYPES, isAllowedAvatarType } from "@/lib/profile/avatar";
import { COVER_ERROR_DETAILS, COVER_MAX_BYTES } from "@/lib/profile/cover";

/**
 * Uploads or removes a cover image (profile hero or goal cover). Client checks
 * give fast feedback; the server revalidates type, size and content
 * authoritatively. The endpoint accepts a multipart POST and a DELETE, and
 * returns `{ coverImageUrl }`.
 *
 * Chrome defaults are localized (common namespace + error codes), so any
 * feature area can use the component untouched; callers may still override
 * with their own translated strings.
 */
export function CoverUploader({
  endpoint,
  initialUrl,
  label,
  helpText,
  aspectClassName = "aspect-[3/1]",
  addLabel,
  changeLabel,
  removeLabel,
  invalidTypeMessage = COVER_ERROR_DETAILS.type,
  tooLargeMessage = COVER_ERROR_DETAILS.size,
}: {
  endpoint: string;
  initialUrl: string | null;
  label: string;
  helpText: string;
  aspectClassName?: string;
  addLabel?: string;
  changeLabel?: string;
  removeLabel?: string;
  /** Client-side pre-check message for a disallowed file type. */
  invalidTypeMessage?: string | ErrorDetail;
  /** Client-side pre-check message for an oversize file. */
  tooLargeMessage?: string | ErrorDetail;
}) {
  const tCommon = useTranslations("common");
  const errorMessage = useErrorMessage();
  const resolvedAddLabel = addLabel ?? tCommon("upload.addImage");
  const resolvedChangeLabel = changeLabel ?? tCommon("upload.changeImage");
  const resolvedRemoveLabel = removeLabel ?? tCommon("upload.remove");
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorDetail | string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!isAllowedAvatarType(file.type)) {
      setError(invalidTypeMessage);
      return;
    }
    if (file.size === 0 || file.size > COVER_MAX_BYTES) {
      setError(tooLargeMessage);
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(endpoint, { method: "POST", body: formData });
      const body = (await response.json().catch(() => ({}))) as {
        coverImageUrl?: string | null;
        error?: ErrorDetail | string;
      };
      if (response.ok && body.coverImageUrl) {
        setUrl(body.coverImageUrl);
      } else {
        setError(body.error ?? errorDetail("generic"));
      }
    } catch {
      setError(errorDetail("generic"));
    }
    setBusy(false);
  }

  async function handleRemove() {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      if (response.ok) {
        setUrl(null);
      } else {
        const body = (await response.json().catch(() => ({}))) as {
          error?: ErrorDetail | string;
        };
        setError(body.error ?? errorDetail("generic"));
      }
    } catch {
      setError(errorDetail("generic"));
    }
    setBusy(false);
  }

  return (
    <div>
      <span className="block text-sm font-medium text-ink/80">{label}</span>
      <div
        className={`mt-2 w-full overflow-hidden rounded-2xl border border-stone bg-mist ${aspectClassName}`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink/30">
            <ImagePlus aria-hidden="true" className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-forest/30 px-5 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-forest/5 disabled:opacity-70"
        >
          {busy ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : null}
          {url ? resolvedChangeLabel : resolvedAddLabel}
        </button>
        {url ? (
          <button
            type="button"
            disabled={busy}
            onClick={handleRemove}
            className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-ink/70 transition-colors hover:text-ink disabled:opacity-70"
          >
            {resolvedRemoveLabel}
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink/70">{helpText}</p>
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ALLOWED_TYPES.join(",")}
        className="sr-only"
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
          event.target.value = "";
        }}
      />
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-800">
          {errorMessage(error)}
        </p>
      ) : null}
    </div>
  );
}
