"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (reason.trim().length === 0) {
      setError("Add a reason — it goes in the audit log.");
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
          error?: string;
        };
        setError(body.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
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
          Reason (audit-logged)
        </label>
        <input
          id="admin-action-reason"
          type="text"
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={
            isDeactivated
              ? "e.g. Issue resolved with the creator"
              : "e.g. Terms breach: misleading goal claims"
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
        {isDeactivated ? "Reinstate profile" : "Deactivate profile"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
