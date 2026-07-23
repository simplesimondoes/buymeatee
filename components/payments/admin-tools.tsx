"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";

const inputClasses =
  "w-full rounded-xl border border-stone bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-forest";

/** Admin full-refund form. The server re-checks authorisation. */
export function AdminRefundForm() {
  const [giftPublicId, setGiftPublicId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftPublicId, reason }),
      });
      const body = (await response.json()) as {
        refundId?: string;
        error?: string;
      };
      setResult(
        response.ok && body.refundId
          ? `Refund ${body.refundId} created. The gift updates when Stripe confirms via webhook.`
          : (body.error ?? "Refund failed."),
      );
    } catch {
      setResult("Refund failed.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="refund-gift" className="text-sm font-medium text-forest">
            Gift public id
          </label>
          <input
            id="refund-gift"
            required
            value={giftPublicId}
            onChange={(event) => setGiftPublicId(event.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
            className={`mt-1.5 ${inputClasses}`}
          />
        </div>
        <div>
          <label htmlFor="refund-reason" className="text-sm font-medium text-forest">
            Reason (audited)
          </label>
          <input
            id="refund-reason"
            required
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={`mt-1.5 ${inputClasses}`}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark disabled:opacity-70"
      >
        {busy ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : null}
        Issue full refund
      </button>
      {result ? (
        <p role="status" className="text-sm text-ink/80">
          {result}
        </p>
      ) : null}
    </form>
  );
}

/** Runs server-side reconciliation and shows the report. */
export function ReconcileButton() {
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setReport(null);
    try {
      const response = await fetch("/api/admin/reconcile", { method: "POST" });
      const body = (await response.json()) as Record<string, unknown>;
      setReport(
        response.ok
          ? `Scanned ${body.scanned}: ${body.markedPaid} paid, ${body.markedExpired} expired, ${body.markedFailed} failed, ${body.cancelledDrafts} drafts cancelled, ${body.stillPending} pending, flagged: ${(body.flagged as string[]).join(", ") || "none"}.`
          : String(body.error ?? "Reconciliation failed."),
      );
    } catch {
      setReport("Reconciliation failed.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-forest/30 px-6 text-sm font-medium text-forest transition-colors hover:border-forest hover:bg-forest/5 disabled:opacity-70"
      >
        {busy ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : null}
        Reconcile stuck gifts
      </button>
      {report ? (
        <p role="status" className="text-sm text-ink/80">
          {report}
        </p>
      ) : null}
    </div>
  );
}
