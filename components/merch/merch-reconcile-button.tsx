"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/** Owner button to run the merch reconciliation sweep (ADR-024, spec §36). */
export function MerchReconcileButton() {
  const t = useTranslations("admin");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/merch/reconcile", { method: "POST" });
      const json = await res.json();
      setResult(JSON.stringify(json));
    } catch {
      setResult("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="min-h-9 rounded-full border border-stone px-4 text-xs disabled:opacity-50"
      >
        {t("merchCatalogue.analytics.reconcile")}
      </button>
      <p className="mt-1 text-xs text-ink/50">{t("merchCatalogue.analytics.reconcileNote")}</p>
      {result ? <p className="mt-2 break-all rounded-xl bg-mist p-3 text-xs text-ink/70">{result}</p> : null}
    </div>
  );
}
