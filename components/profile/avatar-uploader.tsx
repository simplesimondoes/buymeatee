"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { useErrorMessage } from "@/components/intl/use-error-message";
import { Avatar } from "@/components/profile/avatar";
import { errorDetail, type ErrorDetail } from "@/lib/i18n/errors";
import {
  AVATAR_ALLOWED_TYPES,
  AVATAR_MAX_BYTES,
  isAllowedAvatarType,
} from "@/lib/profile/avatar";

/**
 * Uploads or removes the signed-in user's avatar. Client checks give fast
 * feedback; the server revalidates type, size and content authoritatively.
 */
export function AvatarUploader({
  initialAvatarUrl,
  displayName,
}: {
  initialAvatarUrl: string | null;
  displayName: string;
}) {
  const t = useTranslations("settings");
  const errorMessage = useErrorMessage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorDetail | string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!isAllowedAvatarType(file.type)) {
      setError(t("profile.photo.errors.type"));
      return;
    }
    if (file.size === 0 || file.size > AVATAR_MAX_BYTES) {
      setError(t("profile.photo.errors.size"));
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json().catch(() => ({}))) as {
        avatarUrl?: string;
        error?: ErrorDetail | string;
      };
      if (response.ok && body.avatarUrl) {
        setAvatarUrl(body.avatarUrl);
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
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (response.ok) {
        setAvatarUrl(null);
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
      <span className="block text-sm font-medium text-ink/80">
        {t("profile.photo.label")}
      </span>
      <div className="mt-2 flex items-center gap-4">
        <Avatar
          src={avatarUrl}
          name={displayName || t("profile.photo.fallbackName")}
          size="lg"
        />
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-forest/30 px-5 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-forest/5 disabled:opacity-70"
            >
              {busy ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : null}
              {avatarUrl ? t("profile.photo.change") : t("profile.photo.add")}
            </button>
            {avatarUrl ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleRemove}
                className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-ink/60 transition-colors hover:text-ink disabled:opacity-70"
              >
                {t("profile.photo.remove")}
              </button>
            ) : null}
          </div>
          <p className="text-xs leading-relaxed text-ink/60">
            {t("profile.photo.help")}
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ALLOWED_TYPES.join(",")}
        className="sr-only"
        aria-label={t("profile.photo.chooseAria")}
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
