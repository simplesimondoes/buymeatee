"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Owner order ops actions (ADR-024, spec §25/§26): retry Printful submission,
 * retry the creator transfer, or refund the order. Each posts to the audited
 * order-ops route and reloads.
 */
export function MerchOrderActions({ orderId }: { orderId: string }) {
  const t = useTranslations("admin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: string, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/merch/orders/${orderId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason: action === "refund" ? "admin_goodwill" : undefined }),
      });
      const json = await res.json();
      setMessage(JSON.stringify(json.result ?? json));
      if (res.ok) setTimeout(() => window.location.reload(), 1000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/50">
        {t("merchCatalogue.orders.actions")}
      </h2>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => run("retry-fulfilment")} className="min-h-9 rounded-full border border-stone px-4 text-xs disabled:opacity-50">
          {t("merchCatalogue.orders.retryFulfilment")}
        </button>
        <button type="button" disabled={busy} onClick={() => run("retry-transfer")} className="min-h-9 rounded-full border border-stone px-4 text-xs disabled:opacity-50">
          {t("merchCatalogue.orders.retryTransfer")}
        </button>
        <button type="button" disabled={busy} onClick={() => run("refund", t("merchCatalogue.orders.refundConfirm"))} className="min-h-9 rounded-full border border-red-300 px-4 text-xs text-red-700 disabled:opacity-50">
          {t("merchCatalogue.orders.refund")}
        </button>
      </div>
      {message ? <p className="mt-3 break-all rounded-xl bg-mist p-3 text-xs text-ink/70">{message}</p> : null}
    </section>
  );
}
