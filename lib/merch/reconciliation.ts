import "server-only";

import { submitPaidOrderToPrintful } from "@/lib/merch/fulfilment";
import { executeCreatorTransfer } from "@/lib/merch/transfers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Merchandise reconciliation sweep (ADR-024, spec §36). Idempotent and safe to
 * run repeatedly (cron): it re-drives work that should have happened but didn't,
 * relying on the underlying services' own idempotency + flag gates:
 *  - paid orders never submitted to Printful  → submitPaidOrderToPrintful
 *  - shipped orders with an untransferred / failed creator payout → executeCreatorTransfer
 * Also reports diagnostic counts of anything needing attention.
 */

export interface MerchReconcileSummary {
  scanned: number;
  submissionsAttempted: number;
  transfersAttempted: number;
  diagnostics: {
    paidNotSubmitted: number;
    shippedNotTransferred: number;
    transferFailed: number;
    onHold: number;
    reconciliationErrors: number;
  };
}

const SHIPPED_STATUSES = ["partially_shipped", "shipped", "delivered"];

export async function reconcileMerch(): Promise<MerchReconcileSummary> {
  const supabase = getSupabaseAdminClient();
  const summary: MerchReconcileSummary = {
    scanned: 0,
    submissionsAttempted: 0,
    transfersAttempted: 0,
    diagnostics: {
      paidNotSubmitted: 0,
      shippedNotTransferred: 0,
      transferFailed: 0,
      onHold: 0,
      reconciliationErrors: 0,
    },
  };

  // 1. Paid orders that were never submitted to Printful.
  const { data: unsubmitted } = await supabase
    .from("merch_orders")
    .select("id")
    .eq("status", "paid")
    .eq("fulfilment_status", "not_submitted")
    .limit(200);
  const unsubmittedRows = (unsubmitted as { id: string }[]) ?? [];
  summary.diagnostics.paidNotSubmitted = unsubmittedRows.length;
  for (const row of unsubmittedRows) {
    const out = await submitPaidOrderToPrintful(row.id);
    if (out.status === "submitted") summary.submissionsAttempted += 1;
    summary.scanned += 1;
  }

  // 2. Shipped orders whose creator profit hasn't been transferred yet.
  const { data: untransferred } = await supabase
    .from("merch_orders")
    .select("id, transfer_status")
    .in("status", SHIPPED_STATUSES)
    .in("transfer_status", ["none", "transfer_failed"])
    .gt("creator_profit_minor", 0)
    .limit(200);
  const untransferredRows = (untransferred as { id: string; transfer_status: string }[]) ?? [];
  summary.diagnostics.shippedNotTransferred = untransferredRows.length;
  for (const row of untransferredRows) {
    const out = await executeCreatorTransfer(row.id);
    if (out.status === "transferred") summary.transfersAttempted += 1;
    summary.scanned += 1;
  }

  // 3. Diagnostic-only counts (surface for the ops dashboard / alerting).
  const count = async (filter: (q: ReturnType<typeof baseQuery>) => ReturnType<typeof baseQuery>) => {
    const { count: c } = await filter(baseQuery());
    return c ?? 0;
  };
  function baseQuery() {
    return supabase.from("merch_orders").select("*", { count: "exact", head: true });
  }
  summary.diagnostics.transferFailed = await count((q) => q.eq("transfer_status", "transfer_failed"));
  summary.diagnostics.onHold = await count((q) => q.eq("status", "on_hold"));
  summary.diagnostics.reconciliationErrors = await count((q) => q.not("reconciliation_error", "is", null));

  return summary;
}
