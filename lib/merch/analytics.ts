import "server-only";

import type { MerchOrderStatus } from "@/lib/merch/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Merchandise analytics aggregation (ADR-024, spec §35), mirroring the honesty
 * rules of the owner analytics core (ADR-020):
 *  - money is NEVER summed across currencies (per-currency reports);
 *  - GMV / fees / earnings count LIVE-mode paid-family orders only (test-mode
 *    orders are surfaced as a separate count, never mixed in);
 *  - refunds are reported separately, never netted against GMV.
 * buildMerchAnalyticsSnapshot is pure and unit-tested; getMerchAnalyticsSnapshot
 * is a thin paged service-role fetch over it.
 */

/** Order statuses where the customer payment was actually collected. */
const PAID_FAMILY: ReadonlySet<MerchOrderStatus> = new Set([
  "paid",
  "printful_submission_pending",
  "printful_draft_created",
  "printful_confirmed",
  "in_production",
  "partially_shipped",
  "shipped",
  "delivered",
  "partially_refunded",
  "refunded",
  "disputed",
]);

export interface MerchAnalyticsOrderRow {
  currency: string;
  status: MerchOrderStatus;
  livemode: boolean;
  customer_total_minor: number;
  printful_total_cost_minor: number;
  platform_fee_minor: number;
  creator_profit_minor: number;
  creator_profit_released_minor: number;
  refund_status: string;
}

export interface MerchCurrencyReport {
  currency: string;
  paidOrders: number;
  grossMerchandiseValueMinor: number;
  printfulCostMinor: number;
  platformFeeMinor: number;
  creatorEarningsMinor: number;
  transferredMinor: number;
  refundedOrders: number;
}

export interface MerchAnalyticsSnapshot {
  totalOrders: number;
  livePaidOrders: number;
  testModeOrders: number;
  ordersByStatus: Record<string, number>;
  perCurrency: MerchCurrencyReport[];
}

export function buildMerchAnalyticsSnapshot(
  rows: MerchAnalyticsOrderRow[],
): MerchAnalyticsSnapshot {
  const ordersByStatus: Record<string, number> = {};
  const byCurrency = new Map<string, MerchCurrencyReport>();
  let livePaidOrders = 0;
  let testModeOrders = 0;

  const bucket = (currency: string): MerchCurrencyReport => {
    let b = byCurrency.get(currency);
    if (!b) {
      b = {
        currency,
        paidOrders: 0,
        grossMerchandiseValueMinor: 0,
        printfulCostMinor: 0,
        platformFeeMinor: 0,
        creatorEarningsMinor: 0,
        transferredMinor: 0,
        refundedOrders: 0,
      };
      byCurrency.set(currency, b);
    }
    return b;
  };

  for (const row of rows) {
    ordersByStatus[row.status] = (ordersByStatus[row.status] ?? 0) + 1;

    if (!PAID_FAMILY.has(row.status)) {
      continue;
    }
    if (!row.livemode) {
      testModeOrders += 1;
      continue;
    }
    livePaidOrders += 1;
    const b = bucket(row.currency);
    b.paidOrders += 1;
    b.grossMerchandiseValueMinor += row.customer_total_minor;
    b.printfulCostMinor += row.printful_total_cost_minor;
    b.platformFeeMinor += row.platform_fee_minor;
    b.creatorEarningsMinor += row.creator_profit_minor;
    b.transferredMinor += row.creator_profit_released_minor;
    if (row.refund_status === "refunded" || row.refund_status === "partially_refunded") {
      b.refundedOrders += 1;
    }
  }

  return {
    totalOrders: rows.length,
    livePaidOrders,
    testModeOrders,
    ordersByStatus,
    perCurrency: [...byCurrency.values()].sort((a, b) =>
      b.grossMerchandiseValueMinor - a.grossMerchandiseValueMinor,
    ),
  };
}

const PAGE = 1000;
const COLUMNS =
  "currency, status, livemode, customer_total_minor, printful_total_cost_minor, platform_fee_minor, creator_profit_minor, creator_profit_released_minor, refund_status, created_at, id";

/** Paged service-role fetch of all orders, then aggregate in memory. */
export async function getMerchAnalyticsSnapshot(): Promise<MerchAnalyticsSnapshot> {
  const supabase = getSupabaseAdminClient();
  const rows: MerchAnalyticsOrderRow[] = [];
  let from = 0;
  // Keyset by created_at+id would be ideal; range paging is fine at this scale.
  for (;;) {
    const { data, error } = await supabase
      .from("merch_orders")
      .select(COLUMNS)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) {
      break;
    }
    rows.push(...(data as unknown as MerchAnalyticsOrderRow[]));
    if (data.length < PAGE) {
      break;
    }
    from += PAGE;
  }
  return buildMerchAnalyticsSnapshot(rows);
}
