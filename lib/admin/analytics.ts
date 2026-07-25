import "server-only";

import type { SupportedCurrency } from "@/lib/payments/currency";
import { PAID_FAMILY_STATUSES, type GiftStatus } from "@/lib/payments/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Owner analytics (/admin/analytics). Read-only aggregation over the tables
 * the platform already maintains — nothing here writes.
 *
 * Design rules:
 * - Amounts stay integer minor units and are NEVER summed across currencies;
 *   every money figure is reported per currency (ADR-017).
 * - Money metrics count live-mode gifts in the paid family only; test-mode
 *   gifts are surfaced as a separate count, never mixed into revenue.
 * - All bucketing is UTC so figures are stable regardless of server locale.
 * - Aggregation is pure (rows + clock in, snapshot out) so it is unit-tested
 *   without Supabase; the thin fetch wrapper is the only I/O.
 */

export interface AnalyticsProfileRow {
  role: "creator" | "supporter";
  created_at: string;
  deactivated_at: string | null;
}

export interface AnalyticsAccountRow {
  details_submitted: boolean;
  charges_enabled: boolean;
  created_at: string;
}

export interface AnalyticsGiftRow {
  created_at: string;
  paid_at: string | null;
  status: string;
  currency: SupportedCurrency;
  gift_amount: number;
  application_fee_amount: number;
  amount_refunded: number;
  sender_user_id: string | null;
  /** Used only to de-duplicate repeat supporters in memory — never rendered. */
  sender_email: string | null;
  recipient_user_id: string;
  livemode: boolean;
}

export interface AnalyticsSourceRows {
  profiles: AnalyticsProfileRow[];
  earlyAccess: Array<{ created_at: string }>;
  accounts: AnalyticsAccountRow[];
  gifts: AnalyticsGiftRow[];
}

export interface SignupPoint {
  key: string;
  creators: number;
  supporters: number;
}

export interface MoneyPoint {
  key: string;
  count: number;
  giftAmount: number;
  commission: number;
}

export interface WindowComparison {
  current: number;
  previous: number;
  /** Percent change vs the previous window; null when the previous window is 0. */
  changePercent: number | null;
}

export interface GrowthTriple {
  week: WindowComparison; // last 7 days vs the 7 before
  month: WindowComparison; // last 30 days vs the 30 before
  year: WindowComparison; // last 365 days vs the 365 before
}

export interface CurrencyReport {
  currency: SupportedCurrency;
  giftCount: number;
  grossGifts: number;
  commission: number;
  /** Refunds are recorded against donor totals, so this is reported separately, not netted. */
  refundedTotal: number;
  daily: MoneyPoint[];
  monthly: MoneyPoint[];
  volumeGrowth: GrowthTriple;
  commissionGrowth: GrowthTriple;
}

export interface ChurnPoint {
  key: string;
  deactivated: number;
  activeAtStart: number;
  ratePercent: number | null;
}

export interface AnalyticsSnapshot {
  generatedAt: string;
  totals: {
    creators: number;
    supporters: number;
    earlyAccess: number;
    paidGifts: number;
    testGifts: number;
    deactivated: number;
    activeCreators30d: number;
    /** Share of identified supporters with 2+ paid Tees; null until any exist. */
    repeatSupporterRatePercent: number | null;
    identifiedSupporters: number;
  };
  signups: {
    daily: SignupPoint[];
    weekly: SignupPoint[];
    monthly: SignupPoint[];
    earlyAccessMonthly: Array<{ key: string; count: number }>;
    growth: GrowthTriple;
  };
  funnel: {
    creators: number;
    started: number;
    submitted: number;
    ready: number;
  };
  giftCountGrowth: GrowthTriple;
  currencies: CurrencyReport[];
  churnMonthly: ChurnPoint[];
}

const DAY_MS = 86_400_000;

export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function utcMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

/** ISO-8601 week key, e.g. "2026-W30" (weeks start Monday, UTC). */
export function isoWeekKey(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const weekday = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - weekday);
  const isoYear = d.getUTCFullYear();
  const yearStart = Date.UTC(isoYear, 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / DAY_MS + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

export function changePercent(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

function lastNDayKeys(now: Date, n: number): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    keys.push(utcDayKey(new Date(now.getTime() - i * DAY_MS)));
  }
  return keys;
}

function lastNWeekKeys(now: Date, n: number): string[] {
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const weekday = monday.getUTCDay() || 7;
  monday.setUTCDate(monday.getUTCDate() - (weekday - 1));
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    keys.push(isoWeekKey(new Date(monday.getTime() - i * 7 * DAY_MS)));
  }
  return keys;
}

function lastNMonthKeys(now: Date, n: number): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    keys.push(
      utcMonthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))),
    );
  }
  return keys;
}

/**
 * Earliest recorded event across all sources — the platform's effective
 * launch moment. Series start here instead of padding empty history, and
 * expand naturally until they hit their 30-day/12-week/12-month caps.
 */
function earliestEventTime(rows: AnalyticsSourceRows): number | null {
  let earliest: number | null = null;
  const consider = (value: string) => {
    const t = new Date(value).getTime();
    if (Number.isFinite(t) && (earliest === null || t < earliest)) {
      earliest = t;
    }
  };
  for (const p of rows.profiles) consider(p.created_at);
  for (const e of rows.earlyAccess) consider(e.created_at);
  for (const a of rows.accounts) consider(a.created_at);
  for (const g of rows.gifts) consider(g.created_at);
  return earliest;
}

/** Drop leading pre-launch keys. Keys are zero-padded, so >= is chronological. */
function clampKeys(keys: string[], sinceKey: string): string[] {
  const clamped = keys.filter((key) => key >= sinceKey);
  // Always keep the current period so every series has at least one point.
  return clamped.length > 0 ? clamped : keys.slice(-1);
}

function compareWindows(
  items: Array<{ t: number; v: number }>,
  now: Date,
  days: number,
): WindowComparison {
  const end = now.getTime();
  const span = days * DAY_MS;
  let current = 0;
  let previous = 0;
  for (const { t, v } of items) {
    if (t >= end - span && t < end) {
      current += v;
    } else if (t >= end - 2 * span && t < end - span) {
      previous += v;
    }
  }
  return { current, previous, changePercent: changePercent(current, previous) };
}

function growthTriple(
  items: Array<{ t: number; v: number }>,
  now: Date,
): GrowthTriple {
  return {
    week: compareWindows(items, now, 7),
    month: compareWindows(items, now, 30),
    year: compareWindows(items, now, 365),
  };
}

function isPaidFamily(status: string): boolean {
  return PAID_FAMILY_STATUSES.includes(status as GiftStatus);
}

/** Effective revenue timestamp: when the payment settled, else when created. */
function giftTime(gift: AnalyticsGiftRow): number {
  return new Date(gift.paid_at ?? gift.created_at).getTime();
}

export function buildAnalyticsSnapshot(
  rows: AnalyticsSourceRows,
  now: Date,
): AnalyticsSnapshot {
  const { profiles, earlyAccess, accounts, gifts } = rows;

  // --- Sign-ups -----------------------------------------------------------
  const launch = earliestEventTime(rows);
  const launchDate = launch === null ? now : new Date(launch);
  const dayKeys = clampKeys(lastNDayKeys(now, 30), utcDayKey(launchDate));
  const weekKeys = clampKeys(lastNWeekKeys(now, 12), isoWeekKey(launchDate));
  const monthKeys = clampKeys(lastNMonthKeys(now, 12), utcMonthKey(launchDate));

  const emptySignups = (keys: string[]) =>
    new Map(keys.map((key) => [key, { creators: 0, supporters: 0 }]));
  const byDay = emptySignups(dayKeys);
  const byWeek = emptySignups(weekKeys);
  const byMonth = emptySignups(monthKeys);

  for (const profile of profiles) {
    const created = new Date(profile.created_at);
    const field = profile.role === "creator" ? "creators" : "supporters";
    const day = byDay.get(utcDayKey(created));
    if (day) day[field] += 1;
    const week = byWeek.get(isoWeekKey(created));
    if (week) week[field] += 1;
    const month = byMonth.get(utcMonthKey(created));
    if (month) month[field] += 1;
  }

  const toSignupPoints = (buckets: Map<string, { creators: number; supporters: number }>) =>
    [...buckets.entries()].map(([key, value]) => ({ key, ...value }));

  const earlyAccessByMonth = new Map(monthKeys.map((key) => [key, 0]));
  for (const signup of earlyAccess) {
    const key = utcMonthKey(new Date(signup.created_at));
    if (earlyAccessByMonth.has(key)) {
      earlyAccessByMonth.set(key, (earlyAccessByMonth.get(key) ?? 0) + 1);
    }
  }

  const signupEvents = profiles.map((profile) => ({
    t: new Date(profile.created_at).getTime(),
    v: 1,
  }));

  // --- Stripe onboarding funnel -------------------------------------------
  const creatorsTotal = profiles.filter((p) => p.role === "creator").length;
  const funnel = {
    creators: creatorsTotal,
    started: accounts.length,
    submitted: accounts.filter((a) => a.details_submitted).length,
    ready: accounts.filter((a) => a.charges_enabled).length,
  };

  // --- Giving (live, paid family, per currency) ----------------------------
  const paidLiveGifts = gifts.filter((g) => isPaidFamily(g.status) && g.livemode);
  const testGifts = gifts.filter((g) => isPaidFamily(g.status) && !g.livemode).length;

  const currencyMap = new Map<SupportedCurrency, AnalyticsGiftRow[]>();
  for (const gift of paidLiveGifts) {
    const list = currencyMap.get(gift.currency) ?? [];
    list.push(gift);
    currencyMap.set(gift.currency, list);
  }

  const currencies: CurrencyReport[] = [...currencyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, currencyGifts]) => {
      const daily = new Map(
        dayKeys.map((key) => [key, { count: 0, giftAmount: 0, commission: 0 }]),
      );
      const monthly = new Map(
        monthKeys.map((key) => [key, { count: 0, giftAmount: 0, commission: 0 }]),
      );
      let grossGifts = 0;
      let commission = 0;
      let refundedTotal = 0;

      for (const gift of currencyGifts) {
        const when = new Date(giftTime(gift));
        grossGifts += gift.gift_amount;
        commission += gift.application_fee_amount;
        refundedTotal += gift.amount_refunded;
        const day = daily.get(utcDayKey(when));
        if (day) {
          day.count += 1;
          day.giftAmount += gift.gift_amount;
          day.commission += gift.application_fee_amount;
        }
        const month = monthly.get(utcMonthKey(when));
        if (month) {
          month.count += 1;
          month.giftAmount += gift.gift_amount;
          month.commission += gift.application_fee_amount;
        }
      }

      const toPoints = (
        buckets: Map<string, { count: number; giftAmount: number; commission: number }>,
      ) => [...buckets.entries()].map(([key, value]) => ({ key, ...value }));

      return {
        currency,
        giftCount: currencyGifts.length,
        grossGifts,
        commission,
        refundedTotal,
        daily: toPoints(daily),
        monthly: toPoints(monthly),
        volumeGrowth: growthTriple(
          currencyGifts.map((g) => ({ t: giftTime(g), v: g.gift_amount })),
          now,
        ),
        commissionGrowth: growthTriple(
          currencyGifts.map((g) => ({ t: giftTime(g), v: g.application_fee_amount })),
          now,
        ),
      };
    });

  // --- Retention & churn ----------------------------------------------------
  const deactivated = profiles.filter((p) => p.deactivated_at !== null).length;

  const activeCreatorIds = new Set<string>();
  const activeSince = now.getTime() - 30 * DAY_MS;
  for (const gift of paidLiveGifts) {
    if (giftTime(gift) >= activeSince) {
      activeCreatorIds.add(gift.recipient_user_id);
    }
  }

  const supporterGiftCounts = new Map<string, number>();
  for (const gift of paidLiveGifts) {
    const identity =
      gift.sender_user_id ?? gift.sender_email?.trim().toLowerCase() ?? null;
    if (!identity) continue;
    supporterGiftCounts.set(identity, (supporterGiftCounts.get(identity) ?? 0) + 1);
  }
  const identifiedSupporters = supporterGiftCounts.size;
  const repeatSupporters = [...supporterGiftCounts.values()].filter(
    (count) => count >= 2,
  ).length;

  const churnMonthly: ChurnPoint[] = clampKeys(
    lastNMonthKeys(now, 6),
    utcMonthKey(launchDate),
  ).map((key) => {
    const [year, month] = key.split("-").map(Number);
    const start = Date.UTC(year, month - 1, 1);
    const end = Date.UTC(year, month, 1);
    let deactivatedInMonth = 0;
    let activeAtStart = 0;
    for (const profile of profiles) {
      const created = new Date(profile.created_at).getTime();
      const gone = profile.deactivated_at
        ? new Date(profile.deactivated_at).getTime()
        : null;
      if (gone !== null && gone >= start && gone < end) {
        deactivatedInMonth += 1;
      }
      if (created < start && (gone === null || gone >= start)) {
        activeAtStart += 1;
      }
    }
    return {
      key,
      deactivated: deactivatedInMonth,
      activeAtStart,
      ratePercent:
        activeAtStart > 0 ? (deactivatedInMonth / activeAtStart) * 100 : null,
    };
  });

  return {
    generatedAt: now.toISOString(),
    totals: {
      creators: creatorsTotal,
      supporters: profiles.length - creatorsTotal,
      earlyAccess: earlyAccess.length,
      paidGifts: paidLiveGifts.length,
      testGifts,
      deactivated,
      activeCreators30d: activeCreatorIds.size,
      repeatSupporterRatePercent:
        identifiedSupporters > 0
          ? (repeatSupporters / identifiedSupporters) * 100
          : null,
      identifiedSupporters,
    },
    signups: {
      daily: toSignupPoints(byDay),
      weekly: toSignupPoints(byWeek),
      monthly: toSignupPoints(byMonth),
      earlyAccessMonthly: [...earlyAccessByMonth.entries()].map(
        ([key, count]) => ({ key, count }),
      ),
      growth: growthTriple(signupEvents, now),
    },
    funnel,
    giftCountGrowth: growthTriple(
      paidLiveGifts.map((g) => ({ t: giftTime(g), v: 1 })),
      now,
    ),
    currencies,
    churnMonthly,
  };
}

const PAGE_SIZE = 1000;

async function fetchAllRows<T>(table: string, columns: string): Promise<T[]> {
  const supabase = getSupabaseAdminClient();
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(`Analytics fetch failed for ${table}: ${error.message}`);
    }
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE_SIZE) {
      break;
    }
  }
  return rows;
}

export async function getAnalyticsSnapshot(
  now: Date = new Date(),
): Promise<AnalyticsSnapshot> {
  const [profiles, earlyAccess, accounts, gifts] = await Promise.all([
    fetchAllRows<AnalyticsProfileRow>(
      "profiles",
      "role, created_at, deactivated_at",
    ),
    fetchAllRows<{ created_at: string }>("early_access_signups", "created_at"),
    fetchAllRows<AnalyticsAccountRow>(
      "stripe_connected_accounts",
      "details_submitted, charges_enabled, created_at",
    ),
    fetchAllRows<AnalyticsGiftRow>(
      "gifts",
      "created_at, paid_at, status, currency, gift_amount, application_fee_amount, amount_refunded, sender_user_id, sender_email, recipient_user_id, livemode",
    ),
  ]);
  return buildAnalyticsSnapshot({ profiles, earlyAccess, accounts, gifts }, now);
}
