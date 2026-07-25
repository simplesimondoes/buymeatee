"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useErrorMessage } from "@/components/intl/use-error-message";
import type { ErrorDetail } from "@/lib/i18n/errors";

/**
 * Deactivate / reinstate a profile. The reason is mandatory — it becomes the
 * audit-log entry — and the server re-checks admin membership on every call.
 */
export function UserStatusActions({
  userId,
  isDeactivated,
}: {
  userId: string;
  isDeactivated: boolean;
}) {
  const t = useTranslations("admin");
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (reason.trim().length === 0) {
      setError(t("action.reasonRequired"));
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isDeactivated ? "reinstate" : "deactivate",
          reason: reason.trim(),
        }),
      });
      if (response.ok) {
        setReason("");
        router.refresh();
      } else {
        const body = (await response.json().catch(() => ({}))) as {
          error?: ErrorDetail;
        };
        setError(errorMessage(body.error ?? null));
      }
    } catch {
      setError(errorMessage(null));
    }
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="admin-action-reason"
          className="block text-sm font-medium text-ink/80"
        >
          {t("userStatus.reasonLabel")}
        </label>
        <input
          id="admin-action-reason"
          type="text"
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={
            isDeactivated
              ? t("userStatus.reinstatePlaceholder")
              : t("userStatus.deactivatePlaceholder")
          }
          className="mt-1.5 w-full rounded-xl border border-stone bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
        />
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={submit}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-colors disabled:opacity-70 ${
          isDeactivated
            ? "bg-forest text-white hover:bg-forest-dark"
            : "bg-red-800 text-white hover:bg-red-900"
        }`}
      >
        {busy ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : null}
        {isDeactivated
          ? t("userStatus.reinstateButton")
          : t("userStatus.deactivateButton")}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
