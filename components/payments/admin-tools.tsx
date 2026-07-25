"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useErrorMessage } from "@/components/intl/use-error-message";
import { isErrorDetail } from "@/lib/i18n/errors";

const inputClasses =
  "w-full rounded-xl border border-stone bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-forest";

/** Admin full-refund form. The server re-checks authorisation. */
export function AdminRefundForm() {
  const t = useTranslations("admin");
  const errorMessage = useErrorMessage();
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
        error?: unknown;
      };
      setResult(
        response.ok && body.refundId
          ? t("tools.refund.success", { refundId: body.refundId })
          : isErrorDetail(body.error)
            ? errorMessage(body.error)
            : t("tools.refund.failed"),
      );
    } catch {
      setResult(t("tools.refund.failed"));
    }
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="refund-gift" className="text-sm font-medium text-forest">
            {t("tools.refund.giftIdLabel")}
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
            {t("tools.refund.reasonLabel")}
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
        {t("tools.refund.submit")}
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
  const t = useTranslations("admin");
  const errorMessage = useErrorMessage();
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
          ? t("tools.reconcile.report", {
              scanned: Number(body.scanned ?? 0),
              markedPaid: Number(body.markedPaid ?? 0),
              markedExpired: Number(body.markedExpired ?? 0),
              markedFailed: Number(body.markedFailed ?? 0),
              cancelledDrafts: Number(body.cancelledDrafts ?? 0),
              stillPending: Number(body.stillPending ?? 0),
              flagged:
                Array.isArray(body.flagged) && body.flagged.length > 0
                  ? (body.flagged as string[]).join(", ")
                  : t("tools.reconcile.flaggedNone"),
            })
          : isErrorDetail(body.error)
            ? errorMessage(body.error)
            : t("tools.reconcile.failed"),
      );
    } catch {
      setReport(t("tools.reconcile.failed"));
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
        {t("tools.reconcile.run")}
      </button>
      {report ? (
        <p role="status" className="text-sm text-ink/80">
          {report}
        </p>
      ) : null}
    </div>
  );
}
