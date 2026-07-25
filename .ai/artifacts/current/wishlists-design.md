# Design — Creator Wish Lists

> Status: **Built (staged, not released)** · Owner: Simon · Date: 2026-07-25
> Recorded as **ADR-018**. Decisions taken: outright-only, one-and-done, build it.
> Delivered M1–M6 (migration, `lib/wishlist/` domain, checkout/webhook wiring,
> creator + public UI, tests). Awaiting: `supabase db push` for the migration,
> then release on the explicit `Release` instruction.

## 1. What we're building

Creators can list **specific tangible items** supporters can fund, sitting *alongside*
larger Goals on the profile page. Examples: a box of balls, a new driver, a
tournament entry, flights to an event, "buy me a beer".

This is deliberately concrete and on-brand — it makes *Support the journey* tangible.
It reuses existing product vocabulary (Buy a tee, green fee) rather than inventing a
storefront.

**Non-goals (this iteration):** inventory/stock, real fulfilment or shipping, affiliate
links to retailers, variable quantities, chip-in/part-funding (see §4), subscriptions.

## 2. Product framing & vocabulary

- Collective noun on the profile: **Wish list** (a creator's list of asks).
- Each entry: **Wish** / **item**.
- Supporter action reuses the existing **support** language ("Fund the driver",
  "Chip in for flights" only if/when part-funding lands).
- Must not read as crowdfunding or a shop checkout — it's supporting a named ask on a
  journey. No invented "X people bought this" counters (hard rule: no fabricated counts).

## 3. Where it reuses existing architecture

Wish lists are ~90% a re-skin of the **Goals** domain. The payment rails are reused
**unchanged**.

| Concern | Reused from |
| --- | --- |
| Owner-scoped CRUD, `sort_order`, RLS, cover image, lifecycle | `lib/goals/` + `creator_goals` pattern |
| Checkout (destination charge, application fee, exact-amount gross-up) | `createGiftCheckout()` in `lib/payments/gifts.ts` — **no change to the charge path** |
| Fee math, currency rules, min/max | `lib/payments/fees.ts`, `config.ts`, `currency.ts` — **reused as-is** |
| Verified payment recording | `markGiftPaidVerified()` in `lib/payments/webhooks.ts` |
| Public rendering | mirror `components/goals/public-goals` |
| Gift → parent attribution | mirror the existing `gifts.goal_id` column |

The single source of truth for "money received" stays the verified webhook. Nothing
client-side ever asserts an item is funded.

## 4. The one real design decision: outright vs chip-in

Two flavours of a wish:

- **(A) Buy-it-outright** — one supporter funds the whole item in a single charge.
  The item has a fixed price; on the verified paid webhook it flips to `funded` and
  shows who funded it (unless anonymous). Simple, satisfying, low risk.
- **(B) Chip-in / part-funding** — many supporters contribute toward an item's price,
  with a progress bar. This is *functionally a Goal with an item framing* and would
  reuse `apply_goal_contribution()`-style accounting.

**Recommendation: ship (A) first.** It needs no new progress-accounting RPC, no
concurrency-safe increment, and no partial-refund-vs-progress reconciliation. (B) is a
clean follow-up once (A) is proven, and can reuse the exact goal-contribution machinery.

Rest of this doc specs **(A)**.

## 5. Data model

New table `wishlist_items`, mirroring `creator_goals`:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `creator_id` | uuid → profiles | owner |
| `title` | text | e.g. "New driver" |
| `description` | text null | short note / why it matters |
| `image_url` | text null | Supabase Storage, same pattern as goal/avatar covers |
| `currency` | payment_currency | must match creator's Connect payout currency |
| `price_amount` | integer | minor units; validated against `MINIMUM/MAXIMUM_GIFT` |
| `status` | new enum `wishlist_item_status` | `active` / `funded` / `archived` |
| `funded_by_gift_id` | uuid → gifts null | set on verified payment |
| `sort_order` | integer | drag-reorder, like goals |
| `created_at` / `updated_at` | timestamptz | |

Attribution on the existing gifts table:

- Add `gifts.wishlist_item_id uuid null → wishlist_items(id) on delete restrict`,
  exactly parallel to `goal_id`. A gift targets **either** a goal, a wish, or neither
  (free gift) — enforce "at most one of {goal_id, wishlist_item_id}" with a CHECK.

RLS: identical shape to `creator_goals` — owner full CRUD on their rows; public read of
`active`/`funded` items for non-deactivated creators (mirror `lib/discover` / public
goals policies). `funded_by_gift_id` and the `active→funded` flip are **service-role
only** (written by the webhook path), never client-writable — same discipline as
`raised_amount`.

Lifecycle: `active → funded` (webhook, one-shot, guarded like `transitionGiftStatus`) and
`active/funded → archived` (creator). Deleting an item that has paid gifts is blocked
(FK `on delete restrict`) — archive instead, matching goals.

## 6. Payment flow

No new Stripe primitives. A wish purchase is an ordinary one-time destination charge:

1. Supporter clicks **Fund the driver** → composer pre-fills the item's `price_amount`
   and passes `wishlistItemId`.
2. `createGiftCheckout()` gains an optional `wishlistItemId` (parallel to today's
   `goalId`): it validates the item is `active`, belongs to the recipient, and its
   currency matches; sets `wishlist_item_id` on the pending gift; **stamps it into the
   PaymentIntent metadata** (webhook verification already checks metadata).
3. Existing `mode: "payment"` session, fees, gross-up, idempotency — all unchanged.
4. On `markGiftPaidVerified()`, after the exactly-once `paid` transition, if the gift
   carries a `wishlist_item_id`, flip the item to `funded` and set `funded_by_gift_id`
   (guarded `UPDATE ... WHERE status = 'active'` so concurrent charges can't double-fund;
   the loser becomes a normal free/over-gift and we surface it, never silently drop).
5. Refund/dispute of a funding gift → revert the item to `active` (mirror the negative-delta
   handling that goals already do for refunds).

## 7. UI

**Creator (authed):**
- New management surface mirroring the goals editor — list, create, edit, reorder,
  archive, upload image. Reuse the goal form components and API-route shape
  (`app/api/wishlist/route.ts`, `app/api/wishlist/[itemId]/route.ts`,
  `.../[itemId]/image/route.ts`).

**Public profile (`app/t/[username]/page.tsx`):**
- New **Wish list** section, a card grid mirroring `components/goals/public-goals`:
  image, title, note, price, a **Fund** button, and a clear **Funded** state (with
  funder's name unless anonymous). Only render when the creator is `ready`
  (`canReceiveGifts` + livemode match), consistent with the existing gift gating.
- `GiftComposer` gains an optional item context so "Fund" deep-links into it with the
  amount pre-filled and locked to the item price.

**Responsive:** verified at 375 / 768 / 1024 / 1440 (project rule). Accessibility parity
with the goals cards (semantic list, button labels, funded state announced).

## 8. Fees, currency, limits

Reused verbatim. Item `price_amount` is validated by the same `calculateFees()` /
`MINIMUM/MAXIMUM_GIFT` rules and must sit in the creator's payout currency (a "buy me a
beer" at £4 is fine; anything below the per-currency minimum is rejected at create time
with the same messaging goals use).

## 9. Effort & sequencing

| Milestone | Scope | Size |
| --- | --- | --- |
| M1 | Migration: `wishlist_items` + `gifts.wishlist_item_id` + RLS + enum | S |
| M2 | `lib/wishlist/` domain (types, CRUD, public read) mirroring `lib/goals/` | S–M |
| M3 | Checkout + webhook wiring (`wishlistItemId`, metadata, funded flip, refund revert) | M |
| M4 | Creator management UI + API routes | M |
| M5 | Public profile section + composer deep-link | M |
| M6 | Tests (fee/limit, webhook funded/refund, RLS, component) + responsive/a11y pass | M |

**Overall: Small–Medium**, a handful of focused days. No new Stripe objects, no supporter
accounts required, no fee-model change.

## 10. Open questions for sign-off

1. **Outright-only for v1?** (recommended) — or do you want chip-in/part-funding in scope now?
2. **One funder shown, or list of supporters** on a funded item? (v1: single funder + optional message.)
3. **Anonymous funders** — inherit the existing gift `is_anonymous` behaviour? (recommended: yes.)
4. **Re-fund after funded?** Should a "beer" be repeatedly fundable (recurring small item) or one-and-done? (v1: one-and-done; recurring "beers" are better served by the subscriptions work.)
5. **Placement** — Wish list above or below Goals on the profile? (recommended: Goals first, Wish list beneath.)
6. **Preview/seed content** — do we show a labelled `Preview` wish list on creators who have none, like Discover does? (recommended: no — empty state only, avoid fabricated items.)

---

### Next step
On your sign-off (and answers to §10), I'll open the work as issues under the current
milestone, write **ADR-018**, and build M1→M6 in order — pausing before any release per
the release-control rule.
