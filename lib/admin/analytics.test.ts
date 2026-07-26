import { describe, expect, it } from "vitest";

import {
  buildAnalyticsSnapshot,
  changePercent,
  isoWeekKey,
  utcDayKey,
  utcMonthKey,
  type AnalyticsGiftRow,
  type AnalyticsSourceRows,
} from "@/lib/admin/analytics";

const NOW = new Date("2026-07-25T12:00:00.000Z");

function gift(overrides: Partial<AnalyticsGiftRow>): AnalyticsGiftRow {
  return {
    created_at: "2026-07-20T10:00:00.000Z",
    paid_at: "2026-07-20T10:00:00.000Z",
    status: "paid",
    currency: "gbp",
    gift_amount: 500,
    application_fee_amount: 85,
    amount_refunded: 0,
    sender_user_id: null,
    sender_email: "supporter@example.com",
    recipient_user_id: "creator-1",
    livemode: true,
    ...overrides,
  };
}

function emptyRows(): AnalyticsSourceRows {
  return { profiles: [], accounts: [], gifts: [] };
}

describe("time bucketing", () => {
  it("produces UTC day and month keys", () => {
    const d = new Date("2026-07-05T23:30:00.000Z");
    expect(utcDayKey(d)).toBe("2026-07-05");
    expect(utcMonthKey(d)).toBe("2026-07");
  });

  it("computes ISO week keys including year boundaries", () => {
    // 2026-01-01 is a Thursday → ISO week 1 of 2026.
    expect(isoWeekKey(new Date("2026-01-01T00:00:00.000Z"))).toBe("2026-W01");
    // 2023-01-01 is a Sunday → belongs to 2022's last week (W52).
    expect(isoWeekKey(new Date("2023-01-01T00:00:00.000Z"))).toBe("2022-W52");
    expect(isoWeekKey(new Date("2026-07-25T12:00:00.000Z"))).toBe("2026-W30");
  });
});

describe("changePercent", () => {
  it("is null when the previous window is empty", () => {
    expect(changePercent(5, 0)).toBeNull();
  });

  it("computes signed percentage change", () => {
    expect(changePercent(150, 100)).toBe(50);
    expect(changePercent(50, 100)).toBe(-50);
  });
});

describe("buildAnalyticsSnapshot", () => {
  it("returns a safe empty snapshot with no data (just the current period)", () => {
    const snapshot = buildAnalyticsSnapshot(emptyRows(), NOW);
    expect(snapshot.totals.creators).toBe(0);
    expect(snapshot.totals.repeatSupporterRatePercent).toBeNull();
    expect(snapshot.currencies).toEqual([]);
    expect(snapshot.signups.daily).toEqual([
      { key: "2026-07-25", creators: 0, supporters: 0 },
    ]);
    expect(snapshot.signups.weekly.map((p) => p.key)).toEqual(["2026-W30"]);
    expect(snapshot.signups.monthly.map((p) => p.key)).toEqual(["2026-07"]);
    expect(snapshot.churnMonthly.map((p) => p.key)).toEqual(["2026-07"]);
  });

  it("starts every series at the earliest recorded event and expands to the cap", () => {
    const rows = emptyRows();
    rows.profiles = [
      { role: "supporter", created_at: "2026-07-23T09:00:00.000Z", deactivated_at: null },
    ];
    const snapshot = buildAnalyticsSnapshot(rows, NOW);
    // Launch on 23 Jul → 3 daily points (23rd–25th), no empty pre-launch history.
    expect(snapshot.signups.daily.map((p) => p.key)).toEqual([
      "2026-07-23",
      "2026-07-24",
      "2026-07-25",
    ]);
    expect(snapshot.signups.weekly.map((p) => p.key)).toEqual(["2026-W30"]);
    expect(snapshot.signups.monthly.map((p) => p.key)).toEqual(["2026-07"]);

    // A year of history still caps at the window sizes.
    rows.profiles.push({
      role: "creator",
      created_at: "2025-05-01T00:00:00.000Z",
      deactivated_at: null,
    });
    const old = buildAnalyticsSnapshot(rows, NOW);
    expect(old.signups.daily).toHaveLength(30);
    expect(old.signups.weekly).toHaveLength(12);
    expect(old.signups.monthly).toHaveLength(12);
    expect(old.churnMonthly).toHaveLength(6);
  });

  it("buckets sign-ups by role into daily, weekly and monthly series", () => {
    const rows = emptyRows();
    rows.profiles = [
      { role: "creator", created_at: "2026-07-25T01:00:00.000Z", deactivated_at: null },
      { role: "supporter", created_at: "2026-07-25T02:00:00.000Z", deactivated_at: null },
      { role: "supporter", created_at: "2026-07-24T02:00:00.000Z", deactivated_at: null },
      // Outside the 30-day daily window but inside the monthly one.
      { role: "creator", created_at: "2026-06-01T02:00:00.000Z", deactivated_at: null },
    ];
    const snapshot = buildAnalyticsSnapshot(rows, NOW);

    const today = snapshot.signups.daily.at(-1);
    expect(today).toEqual({ key: "2026-07-25", creators: 1, supporters: 1 });
    const june = snapshot.signups.monthly.find((p) => p.key === "2026-06");
    expect(june).toEqual({ key: "2026-06", creators: 1, supporters: 0 });
    const thisWeek = snapshot.signups.weekly.at(-1);
    expect(thisWeek?.key).toBe("2026-W30");
    expect(thisWeek?.creators).toBe(1);
    expect(snapshot.totals.creators).toBe(2);
    expect(snapshot.totals.supporters).toBe(2);
  });

  it("computes rolling growth windows against the preceding window", () => {
    const rows = emptyRows();
    rows.profiles = [
      // Two in the last 7 days, one in the 7 days before.
      { role: "creator", created_at: "2026-07-24T00:00:00.000Z", deactivated_at: null },
      { role: "supporter", created_at: "2026-07-22T00:00:00.000Z", deactivated_at: null },
      { role: "supporter", created_at: "2026-07-14T00:00:00.000Z", deactivated_at: null },
    ];
    const snapshot = buildAnalyticsSnapshot(rows, NOW);
    expect(snapshot.signups.growth.week).toEqual({
      current: 2,
      previous: 1,
      changePercent: 100,
    });
    expect(snapshot.signups.growth.month.current).toBe(3);
    expect(snapshot.signups.growth.month.changePercent).toBeNull();
  });

  it("reports the Stripe onboarding funnel", () => {
    const rows = emptyRows();
    rows.profiles = [
      { role: "creator", created_at: "2026-07-01T00:00:00.000Z", deactivated_at: null },
      { role: "creator", created_at: "2026-07-02T00:00:00.000Z", deactivated_at: null },
      { role: "creator", created_at: "2026-07-03T00:00:00.000Z", deactivated_at: null },
      { role: "supporter", created_at: "2026-07-04T00:00:00.000Z", deactivated_at: null },
    ];
    rows.accounts = [
      { details_submitted: true, charges_enabled: true, created_at: "2026-07-02T00:00:00.000Z" },
      { details_submitted: true, charges_enabled: false, created_at: "2026-07-03T00:00:00.000Z" },
    ];
    const snapshot = buildAnalyticsSnapshot(rows, NOW);
    expect(snapshot.funnel).toEqual({
      creators: 3,
      started: 2,
      submitted: 2,
      ready: 1,
    });
  });

  it("aggregates giving per currency and never mixes currencies", () => {
    const rows = emptyRows();
    rows.gifts = [
      gift({ gift_amount: 500, application_fee_amount: 85 }),
      gift({ gift_amount: 1000, application_fee_amount: 130 }),
      gift({ currency: "eur", gift_amount: 700, application_fee_amount: 100 }),
    ];
    const snapshot = buildAnalyticsSnapshot(rows, NOW);
    expect(snapshot.currencies).toHaveLength(2);
    const gbp = snapshot.currencies.find((c) => c.currency === "gbp");
    expect(gbp?.grossGifts).toBe(1500);
    expect(gbp?.commission).toBe(215);
    expect(gbp?.giftCount).toBe(2);
    const eur = snapshot.currencies.find((c) => c.currency === "eur");
    expect(eur?.grossGifts).toBe(700);
    const day = gbp?.daily.find((p) => p.key === "2026-07-20");
    expect(day).toEqual({
      key: "2026-07-20",
      count: 2,
      giftAmount: 1500,
      commission: 215,
    });
  });

  it("excludes unpaid and test-mode gifts from revenue", () => {
    const rows = emptyRows();
    rows.gifts = [
      gift({}),
      gift({ status: "checkout_created" }),
      gift({ status: "payment_failed" }),
      gift({ livemode: false }),
    ];
    const snapshot = buildAnalyticsSnapshot(rows, NOW);
    expect(snapshot.totals.paidGifts).toBe(1);
    expect(snapshot.totals.testGifts).toBe(1);
    const gbp = snapshot.currencies.find((c) => c.currency === "gbp");
    expect(gbp?.grossGifts).toBe(500);
  });

  it("keeps refunded gifts in the paid family and reports refunds separately", () => {
    const rows = emptyRows();
    rows.gifts = [gift({ status: "refunded", amount_refunded: 605 })];
    const snapshot = buildAnalyticsSnapshot(rows, NOW);
    const gbp = snapshot.currencies.find((c) => c.currency === "gbp");
    expect(gbp?.giftCount).toBe(1);
    expect(gbp?.refundedTotal).toBe(605);
  });

  it("computes the repeat-supporter rate from identified senders only", () => {
    const rows = emptyRows();
    rows.gifts = [
      gift({ sender_email: "a@example.com" }),
      gift({ sender_email: "A@Example.com " }), // same identity, case/space-insensitive
      gift({ sender_email: "b@example.com" }),
      gift({ sender_email: null, sender_user_id: null }), // unidentified — excluded
    ];
    const snapshot = buildAnalyticsSnapshot(rows, NOW);
    expect(snapshot.totals.identifiedSupporters).toBe(2);
    expect(snapshot.totals.repeatSupporterRatePercent).toBe(50);
  });

  it("counts creators supported in the last 30 days", () => {
    const rows = emptyRows();
    rows.gifts = [
      gift({ recipient_user_id: "recent", paid_at: "2026-07-20T00:00:00.000Z" }),
      gift({ recipient_user_id: "old", paid_at: "2026-05-01T00:00:00.000Z" }),
    ];
    const snapshot = buildAnalyticsSnapshot(rows, NOW);
    expect(snapshot.totals.activeCreators30d).toBe(1);
  });

  it("computes monthly churn from deactivations over active accounts", () => {
    const rows = emptyRows();
    rows.profiles = [
      { role: "creator", created_at: "2026-01-01T00:00:00.000Z", deactivated_at: "2026-06-10T00:00:00.000Z" },
      { role: "supporter", created_at: "2026-02-01T00:00:00.000Z", deactivated_at: null },
      { role: "supporter", created_at: "2026-03-01T00:00:00.000Z", deactivated_at: null },
      { role: "supporter", created_at: "2026-04-01T00:00:00.000Z", deactivated_at: null },
      // Created mid-June — not active at the start of June.
      { role: "supporter", created_at: "2026-06-15T00:00:00.000Z", deactivated_at: null },
    ];
    const snapshot = buildAnalyticsSnapshot(rows, NOW);
    const june = snapshot.churnMonthly.find((p) => p.key === "2026-06");
    expect(june).toEqual({
      key: "2026-06",
      deactivated: 1,
      activeAtStart: 4,
      ratePercent: 25,
    });
    const july = snapshot.churnMonthly.find((p) => p.key === "2026-07");
    expect(july?.deactivated).toBe(0);
  });
});
