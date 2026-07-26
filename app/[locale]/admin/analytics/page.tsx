import type { AppLocale } from "@/i18n/locales";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

import { DeltaBadge } from "@/components/admin/analytics/delta-badge";
import { FunnelBars } from "@/components/admin/analytics/funnel-bars";
import { LineChart } from "@/components/admin/analytics/line-chart";
import { StatTile } from "@/components/admin/analytics/stat-tile";
import {
  getAnalyticsSnapshot,
  type AnalyticsSnapshot,
  type GrowthTriple,
} from "@/lib/admin/analytics";
import { canViewAnalytics } from "@/lib/admin/analytics-access";
import {
  formatDate,
  formatDateTime,
  formatMinorAmount,
  formatNumber,
  formatPercent,
} from "@/lib/i18n/format";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "admin",
  });
  return {
    title: t("meta.analytics.title"),
    robots: { index: false, follow: false },
  };
}

/**
 * Owner analytics dashboard. Access is gated to the founder's verified auth
 * email (lib/admin/analytics-access.ts) — everyone else, including other
 * operational admins, gets the same plain 404 as the rest of /admin.
 */
export default async function AdminAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  setRequestLocale(appLocale);

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect({
      href: `/sign-in?next=${encodeURIComponent(`/${locale}/admin/analytics`)}`,
      locale: appLocale,
    });
  }
  if (!canViewAnalytics(user.email)) {
    notFound();
  }

  const t = await getTranslations({ locale: appLocale, namespace: "admin" });

  let snapshot: AnalyticsSnapshot | null = null;
  try {
    snapshot = await getAnalyticsSnapshot();
  } catch {
    snapshot = null;
  }

  if (!snapshot) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Header eyebrow={t("common.eyebrow")} title={t("analytics.title")} />
        <div
          role="alert"
          className="mt-8 rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/80"
        >
          {t("analytics.unavailable")}
        </div>
      </main>
    );
  }

  const noPrior = t("analytics.noPriorData");
  const dayLabel = (key: string) =>
    formatDate(new Date(`${key}T00:00:00Z`), appLocale, {
      day: "numeric",
      month: "short",
    });
  const monthLabel = (key: string) =>
    formatDate(new Date(`${key}-01T00:00:00Z`), appLocale, {
      month: "short",
      year: "2-digit",
    });
  const count = (value: number) => formatNumber(value, appLocale);

  const growthRows: Array<{
    label: string;
    format: (value: number) => string;
    growth: GrowthTriple;
  }> = [
    {
      label: t("analytics.growth.rows.signups"),
      format: count,
      growth: snapshot.signups.growth,
    },
    {
      label: t("analytics.growth.rows.paidTees"),
      format: count,
      growth: snapshot.giftCountGrowth,
    },
    ...snapshot.currencies.flatMap((currency) => [
      {
        label: t("analytics.growth.rows.volume", {
          currency: currency.currency.toUpperCase(),
        }),
        format: (value: number) =>
          formatMinorAmount(value, currency.currency, appLocale),
        growth: currency.volumeGrowth,
      },
      {
        label: t("analytics.growth.rows.commission", {
          currency: currency.currency.toUpperCase(),
        }),
        format: (value: number) =>
          formatMinorAmount(value, currency.currency, appLocale),
        growth: currency.commissionGrowth,
      },
    ]),
  ];

  const funnelShare = (value: number) =>
    snapshot.funnel.creators > 0
      ? formatPercent((value / snapshot.funnel.creators) * 100, appLocale)
      : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <Header eyebrow={t("common.eyebrow")} title={t("analytics.title")} />
      <p className="mt-2 max-w-3xl text-sm text-ink/70">
        {t("analytics.intro")}
      </p>
      <p className="mt-1 text-xs text-ink/50">
        {t("analytics.generatedAt", {
          date: formatDateTime(snapshot.generatedAt, appLocale),
        })}
        {snapshot.totals.testGifts > 0
          ? ` · ${t("analytics.testGiftsNote", { count: snapshot.totals.testGifts })}`
          : null}
      </p>

      {/* KPI row */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t("analytics.kpis.signups7")}
          value={count(snapshot.signups.growth.week.current)}
          delta={{
            changePercent: snapshot.signups.growth.week.changePercent,
            periodLabel: t("analytics.periods.vsPrev7"),
          }}
          locale={appLocale}
          noPriorLabel={noPrior}
        />
        <StatTile
          label={t("analytics.kpis.paidTees7")}
          value={count(snapshot.giftCountGrowth.week.current)}
          delta={{
            changePercent: snapshot.giftCountGrowth.week.changePercent,
            periodLabel: t("analytics.periods.vsPrev7"),
          }}
          locale={appLocale}
          noPriorLabel={noPrior}
        />
        <StatTile
          label={t("analytics.kpis.creators")}
          value={count(snapshot.totals.creators)}
          locale={appLocale}
          noPriorLabel={noPrior}
        />
        <StatTile
          label={t("analytics.kpis.supporters")}
          value={count(snapshot.totals.supporters)}
          locale={appLocale}
          noPriorLabel={noPrior}
        />
        <StatTile
          label={t("analytics.kpis.activeCreators")}
          value={count(snapshot.totals.activeCreators30d)}
          locale={appLocale}
          noPriorLabel={noPrior}
        />
        <StatTile
          label={t("analytics.kpis.repeatRate")}
          value={
            snapshot.totals.repeatSupporterRatePercent === null
              ? "—"
              : formatPercent(
                  snapshot.totals.repeatSupporterRatePercent,
                  appLocale,
                )
          }
          hint={
            snapshot.totals.identifiedSupporters > 0
              ? t("analytics.kpis.repeatRateHint", {
                  total: snapshot.totals.identifiedSupporters,
                })
              : undefined
          }
          locale={appLocale}
          noPriorLabel={noPrior}
        />
        <StatTile
          label={t("analytics.kpis.deactivated")}
          value={count(snapshot.totals.deactivated)}
          locale={appLocale}
          noPriorLabel={noPrior}
        />
      </div>

      {/* Sign-ups */}
      <section aria-labelledby="analytics-signups" className="mt-10">
        <h2
          id="analytics-signups"
          className="font-serif text-2xl font-semibold text-forest"
        >
          {t("analytics.signups.heading")}
        </h2>
        <div className="mt-4 rounded-3xl border border-stone bg-white p-6">
          <h3 className="text-sm font-medium text-ink/80">
            {t("analytics.signups.dailyChart")}
          </h3>
          <div className="mt-4">
            <LineChart
              title={t("analytics.signups.dailyChart")}
              points={snapshot.signups.daily.map((point) => ({
                key: point.key,
                label: dayLabel(point.key),
                values: [point.creators, point.supporters],
              }))}
              series={[
                {
                  name: t("analytics.signups.seriesCreators"),
                  colorVar: "--color-chart-green",
                },
                {
                  name: t("analytics.signups.seriesSupporters"),
                  colorVar: "--color-chart-gold",
                },
              ]}
              formatValue={count}
              labelEvery={snapshot.signups.daily.length > 14 ? 5 : 1}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-stone bg-white p-6">
            <h3 className="text-sm font-medium text-ink/80">
              {t("analytics.signups.weeklyHeading")}
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[20rem] text-left text-sm">
                <thead className="border-b border-stone text-xs uppercase tracking-wide text-ink/60">
                  <tr>
                    <th scope="col" className="py-2 pr-3">
                      {t("analytics.signups.table.period")}
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right">
                      {t("analytics.signups.table.creators")}
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right">
                      {t("analytics.signups.table.supporters")}
                    </th>
                    <th scope="col" className="py-2 text-right">
                      {t("analytics.signups.table.total")}
                    </th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {[...snapshot.signups.weekly].reverse().map((point) => (
                    <tr key={point.key} className="border-b border-stone/60 last:border-0">
                      <td className="py-2 pr-3 text-ink/75">{point.key}</td>
                      <td className="py-2 pr-3 text-right">{count(point.creators)}</td>
                      <td className="py-2 pr-3 text-right">{count(point.supporters)}</td>
                      <td className="py-2 text-right font-medium">
                        {count(point.creators + point.supporters)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-stone bg-white p-6">
            <h3 className="text-sm font-medium text-ink/80">
              {t("analytics.signups.monthlyHeading")}
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[24rem] text-left text-sm">
                <thead className="border-b border-stone text-xs uppercase tracking-wide text-ink/60">
                  <tr>
                    <th scope="col" className="py-2 pr-3">
                      {t("analytics.signups.table.period")}
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right">
                      {t("analytics.signups.table.creators")}
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right">
                      {t("analytics.signups.table.supporters")}
                    </th>
                    <th scope="col" className="py-2 text-right">
                      {t("analytics.signups.table.total")}
                    </th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {[...snapshot.signups.monthly].reverse().map((point) => (
                    <tr key={point.key} className="border-b border-stone/60 last:border-0">
                      <td className="py-2 pr-3 text-ink/75">{monthLabel(point.key)}</td>
                      <td className="py-2 pr-3 text-right">{count(point.creators)}</td>
                      <td className="py-2 pr-3 text-right">{count(point.supporters)}</td>
                      <td className="py-2 text-right font-medium">
                        {count(point.creators + point.supporters)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Growth */}
      <section aria-labelledby="analytics-growth" className="mt-10">
        <h2
          id="analytics-growth"
          className="font-serif text-2xl font-semibold text-forest"
        >
          {t("analytics.growth.heading")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-ink/70">
          {t("analytics.growth.description")}
        </p>
        <div className="mt-4 overflow-x-auto rounded-3xl border border-stone bg-white">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-stone bg-mist text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {t("analytics.growth.metric")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t("analytics.growth.last7")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t("analytics.growth.prev7")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t("analytics.growth.wow")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t("analytics.growth.last30")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t("analytics.growth.prev30")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t("analytics.growth.mom")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t("analytics.growth.last365")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t("analytics.growth.prev365")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t("analytics.growth.yoy")}
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {growthRows.map((row) => (
                <tr key={row.label} className="border-b border-stone/60 last:border-0">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-ink">
                    {row.label}
                  </th>
                  {(["week", "month", "year"] as const).map((window) => {
                    const comparison = row.growth[window];
                    return (
                      <FragmentCells
                        key={window}
                        current={row.format(comparison.current)}
                        previous={row.format(comparison.previous)}
                        changePercent={comparison.changePercent}
                        locale={appLocale}
                        noPriorLabel={noPrior}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Stripe onboarding funnel */}
      <section aria-labelledby="analytics-funnel" className="mt-10">
        <h2
          id="analytics-funnel"
          className="font-serif text-2xl font-semibold text-forest"
        >
          {t("analytics.funnel.heading")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-ink/70">
          {t("analytics.funnel.description")}
        </p>
        <div className="mt-4 rounded-3xl border border-stone bg-white p-6">
          <FunnelBars
            stages={[
              {
                label: t("analytics.funnel.stages.creators"),
                count: snapshot.funnel.creators,
                formattedCount: count(snapshot.funnel.creators),
                percentLabel: null,
              },
              {
                label: t("analytics.funnel.stages.started"),
                count: snapshot.funnel.started,
                formattedCount: count(snapshot.funnel.started),
                percentLabel: funnelShare(snapshot.funnel.started),
              },
              {
                label: t("analytics.funnel.stages.submitted"),
                count: snapshot.funnel.submitted,
                formattedCount: count(snapshot.funnel.submitted),
                percentLabel: funnelShare(snapshot.funnel.submitted),
              },
              {
                label: t("analytics.funnel.stages.ready"),
                count: snapshot.funnel.ready,
                formattedCount: count(snapshot.funnel.ready),
                percentLabel: funnelShare(snapshot.funnel.ready),
              },
            ]}
          />
          {snapshot.funnel.started > 0 ? (
            <p className="mt-4 text-sm text-ink/70">
              {t("analytics.funnel.completionNote", {
                rate: formatPercent(
                  (snapshot.funnel.ready / snapshot.funnel.started) * 100,
                  appLocale,
                ),
              })}
            </p>
          ) : null}
        </div>
      </section>

      {/* Giving per currency */}
      <section aria-labelledby="analytics-giving" className="mt-10">
        <h2
          id="analytics-giving"
          className="font-serif text-2xl font-semibold text-forest"
        >
          {t("analytics.giving.heading")}
        </h2>
        {snapshot.currencies.length === 0 ? (
          <p className="mt-4 rounded-3xl border border-stone bg-mist p-6 text-sm text-ink/70">
            {t("analytics.giving.empty")}
          </p>
        ) : (
          snapshot.currencies.map((currency) => {
            const money = (value: number) =>
              formatMinorAmount(value, currency.currency, appLocale);
            return (
              <div
                key={currency.currency}
                className="mt-6 rounded-3xl border border-stone bg-white p-6"
              >
                <h3 className="text-lg font-semibold text-ink">
                  {t("analytics.giving.currencyHeading", {
                    currency: currency.currency.toUpperCase(),
                  })}
                </h3>
                <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div>
                    <dt className="text-sm text-ink/60">
                      {t("analytics.giving.grossGifts")}
                    </dt>
                    <dd className="mt-0.5 text-2xl font-semibold text-ink">
                      {money(currency.grossGifts)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink/60">
                      {t("analytics.giving.commission")}
                    </dt>
                    <dd className="mt-0.5 text-2xl font-semibold text-ink">
                      {money(currency.commission)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink/60">
                      {t("analytics.giving.paidTees")}
                    </dt>
                    <dd className="mt-0.5 text-2xl font-semibold text-ink">
                      {count(currency.giftCount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink/60">
                      {t("analytics.giving.refunded")}
                    </dt>
                    <dd className="mt-0.5 text-2xl font-semibold text-ink">
                      {money(currency.refundedTotal)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink/60">
                  <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                    {t("analytics.giving.volumeGrowthLabel")}:
                    <DeltaBadge
                      changePercent={currency.volumeGrowth.week.changePercent}
                      locale={appLocale}
                      noPriorLabel={noPrior}
                    />
                    {t("analytics.growth.wow")}
                    <DeltaBadge
                      changePercent={currency.volumeGrowth.month.changePercent}
                      locale={appLocale}
                      noPriorLabel={noPrior}
                    />
                    {t("analytics.growth.mom")}
                    <DeltaBadge
                      changePercent={currency.volumeGrowth.year.changePercent}
                      locale={appLocale}
                      noPriorLabel={noPrior}
                    />
                    {t("analytics.growth.yoy")}
                  </span>
                  <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                    {t("analytics.giving.commissionGrowthLabel")}:
                    <DeltaBadge
                      changePercent={currency.commissionGrowth.week.changePercent}
                      locale={appLocale}
                      noPriorLabel={noPrior}
                    />
                    {t("analytics.growth.wow")}
                    <DeltaBadge
                      changePercent={currency.commissionGrowth.month.changePercent}
                      locale={appLocale}
                      noPriorLabel={noPrior}
                    />
                    {t("analytics.growth.mom")}
                    <DeltaBadge
                      changePercent={currency.commissionGrowth.year.changePercent}
                      locale={appLocale}
                      noPriorLabel={noPrior}
                    />
                    {t("analytics.growth.yoy")}
                  </span>
                </div>

                <h4 className="mt-6 text-sm font-medium text-ink/80">
                  {t("analytics.giving.monthlyChart")}
                </h4>
                <div className="mt-4">
                  <LineChart
                    title={t("analytics.giving.monthlyChart")}
                    points={currency.monthly.map((point) => ({
                      key: point.key,
                      label: monthLabel(point.key),
                      values: [point.giftAmount, point.commission],
                    }))}
                    series={[
                      {
                        name: t("analytics.giving.seriesGifts"),
                        colorVar: "--color-chart-green",
                      },
                      {
                        name: t("analytics.giving.seriesCommission"),
                        colorVar: "--color-chart-gold",
                      },
                    ]}
                    formatValue={(value) =>
                      formatMinorAmount(value, currency.currency, appLocale, {
                        trimWholeAmounts: true,
                      })
                    }
                  />
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Retention & churn */}
      <section aria-labelledby="analytics-churn" className="mt-10">
        <h2
          id="analytics-churn"
          className="font-serif text-2xl font-semibold text-forest"
        >
          {t("analytics.churn.heading")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-ink/70">
          {t("analytics.churn.description")}
        </p>
        <div className="mt-4 overflow-x-auto rounded-3xl border border-stone bg-white">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="border-b border-stone bg-mist text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {t("analytics.churn.table.month")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t("analytics.churn.table.deactivated")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t("analytics.churn.table.activeAtStart")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t("analytics.churn.table.rate")}
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[...snapshot.churnMonthly].reverse().map((point) => (
                <tr key={point.key} className="border-b border-stone/60 last:border-0">
                  <td className="px-4 py-3 text-ink/75">{monthLabel(point.key)}</td>
                  <td className="px-4 py-3 text-right">{count(point.deactivated)}</td>
                  <td className="px-4 py-3 text-right">{count(point.activeAtStart)}</td>
                  <td className="px-4 py-3 text-right">
                    {point.ratePercent === null
                      ? "—"
                      : formatPercent(point.ratePercent, appLocale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="text-sm font-medium uppercase tracking-wide text-gold-deep">
        {eyebrow}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-forest">
        {title}
      </h1>
    </>
  );
}

/** The three value cells + delta cell for one comparison window. */
function FragmentCells({
  current,
  previous,
  changePercent,
  locale,
  noPriorLabel,
}: {
  current: string;
  previous: string;
  changePercent: number | null;
  locale: AppLocale;
  noPriorLabel: string;
}) {
  return (
    <>
      <td className="px-4 py-3 text-right font-medium">{current}</td>
      <td className="px-4 py-3 text-right text-ink/60">{previous}</td>
      <td className="px-4 py-3 text-right">
        <DeltaBadge
          changePercent={changePercent}
          locale={locale}
          noPriorLabel={noPriorLabel}
        />
      </td>
    </>
  );
}
