"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ModerationPayload =
  | { action: "goal_take_down" | "goal_restore"; goalId: string }
  | { action: "clear_bio" | "remove_avatar"; userId: string };

/**
 * One moderation action with its mandatory audit reason. Reveals a reason
 * field on first click, submits on the second — no accidental takedowns.
 */
export function ModerationAction({
  payload,
  label,
  destructive = true,
}: {
  payload: ModerationPayload;
  label: string;
  destructive?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
      const response = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, reason: reason.trim() }),
      });
      if (response.ok) {
        setOpen(false);
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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-9 items-center justify-center rounded-full border px-3.5 text-xs font-medium transition-colors ${
          destructive
            ? "border-red-200 text-red-800 hover:border-red-800"
            : "border-forest/30 text-forest hover:border-forest"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`reason-${label}`}>
        Reason for {label}
      </label>
      <input
        id={`reason-${label}`}
        type="text"
        maxLength={500}
        value={reason}
        autoFocus
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason (audit-logged)"
        className="w-56 rounded-xl border border-stone bg-white px-3 py-1.5 text-xs text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none"
      />
      <button
        type="button"
        disabled={busy}
        onClick={submit}
        className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3.5 text-xs font-medium text-white transition-colors disabled:opacity-70 ${
          destructive ? "bg-red-800 hover:bg-red-900" : "bg-forest hover:bg-forest-dark"
        }`}
      >
        {busy ? (
          <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
        ) : null}
        Confirm
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setError(null);
        }}
        className="text-xs font-medium text-ink/60 hover:text-ink"
      >
        Cancel
      </button>
      {error ? (
        <span role="alert" className="w-full text-xs text-red-800">
          {error}
        </span>
      ) : null}
    </span>
  );
}
