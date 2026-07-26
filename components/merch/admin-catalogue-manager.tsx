"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/payments/currency";
import { formatMinorAmount } from "@/lib/i18n/format";
import type { AppLocale } from "@/i18n/locales";
import { useLocale } from "next-intl";
import type { AdminCuratedRow } from "@/lib/merch/admin-catalogue";
import type { PendingProduct } from "@/lib/merch/moderation";

/**
 * Owner-only merch catalogue curation UI (ADR-024, spec §6). Load a Printful
 * product by id, pick the colours/sizes to expose, and add it to the catalogue
 * with real Printful variant ids. Fails honestly when Printful isn't configured.
 */

interface LoadedOptions {
  printfulProductId: number;
  title: string;
  currency: string;
  colours: string[];
  sizes: string[];
  variantCount: number;
}

interface SearchResult {
  id: number;
  title: string;
  typeName: string;
  brand: string | null;
  imageUrl: string | null;
  variantCount: number;
}

const input = "min-h-11 w-full rounded-xl border border-stone bg-white px-3 text-ink focus:border-forest focus:ring-2 focus:ring-forest/20";

export function AdminCatalogueManager({
  curated,
  pending,
  printfulConfigured,
}: {
  curated: AdminCuratedRow[];
  pending: PendingProduct[];
  printfulConfigured: boolean;
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as AppLocale;

  async function moderate(productId: string, decision: string) {
    let reason: string | undefined;
    if (decision !== "approve") {
      reason = window.prompt(t("merchCatalogue.moderation.reasonPrompt")) ?? undefined;
      if (!reason) return;
    }
    const res = await fetch("/api/admin/merch/moderate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, decision, reason }),
    });
    if (res.ok) window.location.reload();
  }
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loaded, setLoaded] = useState<LoadedOptions | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState<string>("eur");
  const [colours, setColours] = useState<Set<string>>(new Set());
  const [sizes, setSizes] = useState<Set<string>>(new Set());
  const [placements, setPlacements] = useState("front");
  const [minPrice, setMinPrice] = useState("2000");
  const [enabled, setEnabled] = useState(false);

  function toggle(set: Set<string>, value: string): Set<string> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  async function search() {
    setBusy(true);
    setMessage(null);
    setLoaded(null);
    try {
      const res = await fetch(`/api/admin/merch/catalogue?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (!res.ok) {
        setMessage(t("merchCatalogue.error"));
        setResults(null);
      } else {
        setResults(json.results as SearchResult[]);
      }
    } catch {
      setMessage(t("merchCatalogue.error"));
    } finally {
      setBusy(false);
    }
  }

  async function load(productId: number) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/merch/catalogue?productId=${productId}`);
      const json = await res.json();
      if (!res.ok) {
        setMessage(t("merchCatalogue.error"));
        setLoaded(null);
      } else {
        setLoaded(json.options as LoadedOptions);
        setCurrency((json.options.currency as string) || "eur");
      }
    } catch {
      setMessage(t("merchCatalogue.error"));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!loaded) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/merch/catalogue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          printfulProductId: loaded.printfulProductId,
          slug,
          displayName: displayName || undefined,
          currency,
          colours: [...colours],
          sizes: [...sizes],
          placements: placements.split(",").map((p) => p.trim()).filter(Boolean),
          minimumRetailPriceMinor: Number.parseInt(minPrice, 10) || 0,
          enabled,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(`${t("merchCatalogue.error")}${json.detail ? ` (${json.detail})` : ""}`);
      } else {
        setMessage(t("merchCatalogue.saved", { count: json.variantCount }));
        setTimeout(() => window.location.reload(), 800);
      }
    } catch {
      setMessage(t("merchCatalogue.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-3xl text-ink">{t("merchCatalogue.title")}</h1>
      <p className="mt-2 max-w-2xl text-ink/70">{t("merchCatalogue.subtitle")}</p>

      {!printfulConfigured ? (
        <div className="mt-6 rounded-3xl border border-stone bg-mist p-6 text-ink/70">
          {t("merchCatalogue.notConfigured")}
        </div>
      ) : (
        <section className="mt-6 rounded-3xl border border-stone bg-white p-6">
          <form
            onSubmit={(e) => { e.preventDefault(); void search(); }}
            className="flex flex-wrap items-end gap-3"
          >
            <label className="flex-1">
              <span className="mb-1 block text-sm text-ink/70">{t("merchCatalogue.search.searchLabel")}</span>
              <input
                className={input}
                value={query}
                placeholder={t("merchCatalogue.search.searchPlaceholder")}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded-full bg-forest px-5 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy && !loaded ? t("merchCatalogue.search.searching") : t("merchCatalogue.search.searchButton")}
            </button>
          </form>

          {results && !loaded ? (
            results.length === 0 ? (
              <p className="mt-4 text-sm text-ink/60">{t("merchCatalogue.search.noResults")}</p>
            ) : (
              <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto">
                {results.map((rp) => (
                  <li key={rp.id} className="flex items-center gap-3 rounded-2xl border border-stone p-2">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist">
                      {rp.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={rp.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{rp.title}</p>
                      <p className="truncate text-xs text-ink/50">
                        {[rp.brand, rp.typeName].filter(Boolean).join(" · ")} · {rp.variantCount} {t("merchCatalogue.search.variants")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => load(rp.id)}
                      disabled={busy}
                      className="min-h-9 shrink-0 rounded-full border border-forest px-4 text-xs font-medium text-forest disabled:opacity-50"
                    >
                      {t("merchCatalogue.search.select")}
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {loaded ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-ink/70">
                {t("merchCatalogue.loaded", { title: loaded.title, count: loaded.variantCount })}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-sm text-ink/70">{t("merchCatalogue.slugLabel")}</span>
                  <input className={input} value={slug} onChange={(e) => setSlug(e.target.value)} />
                </label>
                <label>
                  <span className="mb-1 block text-sm text-ink/70">{t("merchCatalogue.displayNameLabel")}</span>
                  <input className={input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </label>
                <label>
                  <span className="mb-1 block text-sm text-ink/70">{t("merchCatalogue.currencyLabel")}</span>
                  <select className={input} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c.toUpperCase()}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-sm text-ink/70">{t("merchCatalogue.minPriceLabel")}</span>
                  <input className={input} value={minPrice} inputMode="numeric" onChange={(e) => setMinPrice(e.target.value)} />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-sm text-ink/70">{t("merchCatalogue.placementsLabel")}</span>
                  <input className={input} value={placements} onChange={(e) => setPlacements(e.target.value)} />
                </label>
              </div>

              <fieldset>
                <legend className="mb-2 text-sm text-ink/70">{t("merchCatalogue.coloursLabel")}</legend>
                <div className="flex flex-wrap gap-2">
                  {loaded.colours.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColours((s) => toggle(s, c))}
                      className={`rounded-full border px-3 py-1 text-sm ${colours.has(c) ? "border-forest bg-forest/10 text-forest" : "border-stone text-ink/70"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm text-ink/70">{t("merchCatalogue.sizesLabel")}</legend>
                <div className="flex flex-wrap gap-2">
                  {loaded.sizes.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSizes((prev) => toggle(prev, s))}
                      className={`rounded-full border px-3 py-1 text-sm ${sizes.has(s) ? "border-forest bg-forest/10 text-forest" : "border-stone text-ink/70"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="flex items-center gap-2 text-sm text-ink/70">
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                {t("merchCatalogue.enabledLabel")}
              </label>

              <button
                type="button"
                onClick={save}
                disabled={busy || !slug || colours.size === 0 || sizes.size === 0}
                className="min-h-11 rounded-full bg-forest px-6 text-sm font-medium text-white disabled:opacity-50"
              >
                {t("merchCatalogue.saveButton")}
              </button>
            </div>
          ) : null}

          {message ? <p className="mt-4 text-sm text-ink">{message}</p> : null}
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
          {t("merchCatalogue.moderation.pendingHeading")}
        </h2>
        {pending.length === 0 ? (
          <p className="text-ink/60">{t("merchCatalogue.moderation.noPending")}</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <li key={p.id} className="rounded-3xl border border-stone bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-medium text-ink">{p.title}</span>
                    {p.estimatedCreatorProfitMinor !== null && (
                      <span className="ml-3 text-sm text-ink/60">
                        {t("merchCatalogue.moderation.profitLabel")}:{" "}
                        {formatMinorAmount(p.estimatedCreatorProfitMinor, p.currency as SupportedCurrency, locale)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => moderate(p.id, "approve")} className="min-h-9 rounded-full bg-forest px-4 text-xs font-medium text-white">
                      {t("merchCatalogue.moderation.approve")}
                    </button>
                    <button type="button" onClick={() => moderate(p.id, "request_changes")} className="min-h-9 rounded-full border border-stone px-4 text-xs">
                      {t("merchCatalogue.moderation.requestChanges")}
                    </button>
                    <button type="button" onClick={() => moderate(p.id, "reject")} className="min-h-9 rounded-full border border-stone px-4 text-xs text-red-700">
                      {t("merchCatalogue.moderation.reject")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
          {t("merchCatalogue.curatedHeading")}
        </h2>
        {curated.length === 0 ? (
          <p className="text-ink/60">{t("merchCatalogue.none")}</p>
        ) : (
          <ul className="divide-y divide-stone rounded-3xl border border-stone bg-white">
            {curated.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="text-ink">{c.displayName} <span className="text-ink/40">/{c.slug}</span></span>
                <span className="text-ink/60">
                  {c.currency.toUpperCase()} · {c.variantCount} variants · {c.enabled ? "enabled" : "disabled"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
