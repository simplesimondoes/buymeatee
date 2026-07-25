"use client";

import { ArrowDown, ArrowUp, CircleCheck, Plus } from "lucide-react";
import { useState } from "react";

import { CoverUploader } from "@/components/profile/cover-uploader";
import {
  WishlistItemForm,
  type WishlistFormErrors,
} from "@/components/wishlist/wishlist-item-form";
import { formatMinorAmount, type SupportedCurrency } from "@/lib/payments/currency";
import type { WishlistItemInput } from "@/lib/wishlist/item-schema";
import {
  type WishlistItemRow,
  type WishlistItemStatus,
} from "@/lib/wishlist/types";

/**
 * The creator's wish list: create, edit, reorder and move items through their
 * lifecycle. The server owns every rule (transitions, currency freeze,
 * fundability) — this component just reflects its answers. 'funded' is never a
 * button here: only a supporter's verified payment sets it (ADR-018).
 */

const statusChips: Record<WishlistItemStatus, { label: string; classes: string }> =
  {
    draft: { label: "Draft", classes: "bg-mist text-ink/70" },
    active: { label: "On your page", classes: "bg-forest/10 text-forest" },
    funded: { label: "Funded", classes: "bg-gold/20 text-gold-deep" },
    archived: { label: "Archived", classes: "bg-stone/60 text-ink/60" },
  };

type Transition = { to: WishlistItemStatus; label: string; emphasis?: boolean };

const transitionsFor: Record<WishlistItemStatus, Transition[]> = {
  draft: [{ to: "active", label: "Publish to your page", emphasis: true }],
  active: [{ to: "draft", label: "Take off your page" }],
  funded: [],
  archived: [{ to: "draft", label: "Restore as draft" }],
};

const secondaryButton =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-stone px-3.5 text-xs font-medium text-ink/70 transition-colors hover:border-forest/40 hover:text-forest disabled:opacity-60";

async function postItemAction(
  itemId: string,
  body: Record<string, unknown>,
): Promise<{ item?: WishlistItemRow; errors?: WishlistFormErrors; error?: string }> {
  try {
    const response = await fetch(`/api/wishlist/${itemId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json().catch(() => ({}))) as {
      item?: WishlistItemRow;
      errors?: WishlistFormErrors;
      error?: string;
    };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export function WishlistManager({
  initialItems,
  payoutCurrency,
}: {
  initialItems: WishlistItemRow[];
  payoutCurrency?: SupportedCurrency;
}) {
  const [items, setItems] = useState(initialItems);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const activeCount = items.filter((item) => item.status === "active").length;

  function replaceItem(updated: WishlistItemRow) {
    setItems((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  async function handleCreate(input: WishlistItemInput) {
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = (await response.json().catch(() => ({}))) as {
        item?: WishlistItemRow;
        errors?: WishlistFormErrors;
        error?: string;
      };
      if (response.ok && body.item) {
        setItems((current) => [...current, body.item as WishlistItemRow]);
        setCreating(false);
        return null;
      }
      return { errors: body.errors, error: body.error };
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
  }

  async function handleEdit(itemId: string, input: WishlistItemInput) {
    const body = await postItemAction(itemId, { action: "edit", ...input });
    if (body.item) {
      replaceItem(body.item);
      setEditingId(null);
      return null;
    }
    return { errors: body.errors, error: body.error };
  }

  async function handleTransition(itemId: string, to: WishlistItemStatus) {
    setActionError(null);
    setBusyId(itemId);
    const body = await postItemAction(itemId, { action: "transition", to });
    setBusyId(null);
    if (body.item) {
      replaceItem(body.item);
    } else {
      setActionError(body.error ?? "Something went wrong. Please try again.");
    }
  }

  async function handleMove(itemId: string, direction: "up" | "down") {
    setActionError(null);
    const index = items.findIndex((item) => item.id === itemId);
    const neighbourIndex = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || !items[neighbourIndex]) {
      return;
    }
    setBusyId(itemId);
    const body = await postItemAction(itemId, { action: "move", direction });
    setBusyId(null);
    if (body.error) {
      setActionError(body.error);
      return;
    }
    setItems((current) => {
      const next = [...current];
      [next[index], next[neighbourIndex]] = [next[neighbourIndex], next[index]];
      return next;
    });
  }

  async function handleDelete(itemId: string) {
    setActionError(null);
    setBusyId(itemId);
    try {
      const response = await fetch(`/api/wishlist/${itemId}`, { method: "DELETE" });
      if (response.ok) {
        setItems((current) => current.filter((item) => item.id !== itemId));
      } else {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setActionError(body.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
    setBusyId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink/70">
          {activeCount} {activeCount === 1 ? "item" : "items"} on your page
        </p>
        {!creating ? (
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setEditingId(null);
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New item
          </button>
        ) : null}
      </div>

      {actionError ? (
        <p role="alert" className="text-sm text-red-800">
          {actionError}
        </p>
      ) : null}

      {creating ? (
        <div className="rounded-3xl border border-stone bg-white p-6">
          <h2 className="mb-4 font-serif text-lg font-semibold text-forest">
            New item
          </h2>
          <WishlistItemForm
            payoutCurrency={payoutCurrency}
            submitLabel="Save item"
            onCancel={() => setCreating(false)}
            onSubmit={handleCreate}
          />
        </div>
      ) : null}

      {items.length === 0 && !creating ? (
        <div className="rounded-3xl border border-stone bg-mist p-6 text-center sm:p-10">
          <h2 className="font-serif text-xl font-semibold text-forest">
            What would help your journey?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
            Wish-list items are specific and tangible: a box of balls, a
            tournament entry, a coaching session, travel to a qualifier, even a
            beer after a good round. For instance &ldquo;A dozen tour balls —
            £45&rdquo; <em>(Example)</em>. Supporters fund the whole item in one
            Tee.
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-forest-dark"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add your first item
          </button>
        </div>
      ) : null}

      <ul className="space-y-4">
        {items.map((item, index) => {
          const chip = statusChips[item.status];
          const busy = busyId === item.id;
          const funded = item.status === "funded";
          return (
            <li
              key={item.id}
              className="rounded-3xl border border-stone bg-white p-5 sm:p-6"
            >
              {editingId === item.id ? (
                <div className="space-y-6">
                  <CoverUploader
                    endpoint={`/api/wishlist/${item.id}/image`}
                    initialUrl={item.image_url}
                    label="Item image"
                    helpText="JPEG, PNG or WebP up to 5 MB. A clear photo helps supporters picture what they're funding."
                    aspectClassName="aspect-[4/3]"
                  />
                  <WishlistItemForm
                    initialTitle={item.title}
                    initialDescription={item.description ?? ""}
                    initialCurrency={item.currency}
                    initialPriceAmount={item.price_amount}
                    priceLocked={item.funded_by_gift_id !== null}
                    payoutCurrency={payoutCurrency}
                    submitLabel="Save changes"
                    onCancel={() => setEditingId(null)}
                    onSubmit={(input) => handleEdit(item.id, input)}
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-forest">
                        {item.title}
                      </h3>
                      {item.description ? (
                        <p className="mt-1 text-sm leading-relaxed text-ink/75">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${chip.classes}`}
                    >
                      {chip.label}
                    </span>
                  </div>

                  <p className="mt-4 text-sm font-semibold text-forest">
                    {formatMinorAmount(item.price_amount, item.currency)}
                  </p>

                  {funded ? (
                    <p className="mt-4 flex items-center gap-2 rounded-2xl bg-gold/10 p-3 text-sm text-gold-deep">
                      <CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0" />
                      A supporter funded this — thank them on your next update!
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {transitionsFor[item.status].map((transition) => (
                      <button
                        key={transition.to + transition.label}
                        type="button"
                        disabled={busy}
                        onClick={() => handleTransition(item.id, transition.to)}
                        className={
                          transition.emphasis
                            ? "inline-flex min-h-9 items-center justify-center rounded-full bg-forest px-4 text-xs font-medium text-white transition-colors hover:bg-forest-dark disabled:opacity-60"
                            : secondaryButton
                        }
                      >
                        {transition.label}
                      </button>
                    ))}
                    {item.status !== "archived" ? (
                      <>
                        {!funded ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setEditingId(item.id);
                              setCreating(false);
                            }}
                            className={secondaryButton}
                          >
                            Edit
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleTransition(item.id, "archived")}
                          className={secondaryButton}
                        >
                          Archive
                        </button>
                      </>
                    ) : null}
                    {item.funded_by_gift_id === null && item.status === "draft" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex min-h-9 items-center justify-center rounded-full px-3.5 text-xs font-medium text-red-800/80 transition-colors hover:text-red-800 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    ) : null}
                    <span className="ml-auto flex gap-1">
                      <button
                        type="button"
                        disabled={busy || index === 0}
                        onClick={() => handleMove(item.id, "up")}
                        aria-label={`Move ${item.title} up`}
                        className={`${secondaryButton} px-2.5`}
                      >
                        <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={busy || index === items.length - 1}
                        onClick={() => handleMove(item.id, "down")}
                        aria-label={`Move ${item.title} down`}
                        className={`${secondaryButton} px-2.5`}
                      >
                        <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
