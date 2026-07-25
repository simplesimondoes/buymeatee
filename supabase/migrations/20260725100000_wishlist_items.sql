-- BuyMeATee creator wish lists (ADR-018)
--
-- 1. public.wishlist_items — specific, tangible asks a supporter can fund
--    (a box of balls, a driver, flights, tournament entry, "buy me a beer"),
--    sitting alongside larger creator_goals.
-- 2. public.gifts.wishlist_item_id — optional attribution of a gift to one item.
-- 3. Funded state is service-role only: a wish becomes 'funded' exclusively via
--    the verified Stripe webhook path (mirrors ADR-011's raised_amount rule).
--    Clients — including the item's owner — can never mark an item funded.
--
-- v1 is OUTRIGHT + ONE-AND-DONE: one supporter funds the whole item in a single
-- destination charge, so the gift amount must equal the item price. Chip-in /
-- part-funding is a deliberate future follow-up (would reuse the goals model).
-- Amounts are integer minor units. Never floats.

-- ---------------------------------------------------------------------------
-- Enum + table
-- ---------------------------------------------------------------------------

create type public.wishlist_item_status as enum ('draft', 'active', 'funded', 'archived');

create table public.wishlist_items (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references public.profiles (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 120),
  description   text check (char_length(description) <= 1000),
  image_url     text check (char_length(image_url) <= 500),
  currency      public.payment_currency not null,
  -- Integer minor units. The price a single supporter pays to fund the item.
  -- Fundability (within the single-gift min/max) is enforced in lib/wishlist.
  price_amount  integer not null check (price_amount > 0),
  status        public.wishlist_item_status not null default 'draft',
  -- Set by the verified webhook path only. No client grant exists for it, so a
  -- creator can never invent a purchase by flipping their own item to 'funded'.
  funded_by_gift_id uuid references public.gifts (id) on delete set null,
  funded_at     timestamptz,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- A wish can only be 'funded' once a real gift is attributed to it. Combined
  -- with the missing column grant below, clients cannot reach 'funded' at all.
  constraint wishlist_items_funded_requires_gift
    check (status <> 'funded' or funded_by_gift_id is not null)
);

comment on table public.wishlist_items is
  'A Creator''s wish-list items. status becomes ''funded'' only via the verified webhook path (ADR-018) — never from clients.';
comment on column public.wishlist_items.funded_by_gift_id is
  'The gift that funded this item. Service-role only; no client column grant exists on purpose.';

create index wishlist_items_creator_idx
  on public.wishlist_items (creator_id, status, sort_order, created_at);

create trigger wishlist_items_set_updated_at
  before update on public.wishlist_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Integrity trigger (defence in depth; server code enforces this first)
-- ---------------------------------------------------------------------------

-- Once a wish has been funded its financial identity is frozen: price and
-- currency can't move (the supporter paid exactly that). Archiving stays
-- allowed so a creator can tidy their list.
create or replace function public.prevent_funded_wishlist_item_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.funded_by_gift_id is not null then
    if new.price_amount is distinct from old.price_amount then
      raise exception 'A funded wish-list item cannot change its price.';
    end if;
    if new.currency is distinct from old.currency then
      raise exception 'A funded wish-list item cannot change its currency.';
    end if;
  end if;
  return new;
end;
$$;

create trigger wishlist_items_prevent_funded_mutation
  before update on public.wishlist_items
  for each row execute function public.prevent_funded_wishlist_item_mutation();

-- ---------------------------------------------------------------------------
-- Row-level security + column privileges
-- ---------------------------------------------------------------------------

alter table public.wishlist_items enable row level security;

-- Anyone may read items a creator has published or that are funded (proof of a
-- real journey). Drafts and archived items are visible to their owner only.
create policy "Published wish-list items are viewable by everyone"
  on public.wishlist_items for select
  using (status in ('active', 'funded'));

create policy "Creators can view all their own wish-list items"
  on public.wishlist_items for select
  using ((select auth.uid()) = creator_id);

create policy "Creators can insert their own wish-list items"
  on public.wishlist_items for insert
  with check ((select auth.uid()) = creator_id);

create policy "Creators can update their own wish-list items"
  on public.wishlist_items for update
  using ((select auth.uid()) = creator_id)
  with check ((select auth.uid()) = creator_id);

create policy "Creators can delete their own wish-list items"
  on public.wishlist_items for delete
  using ((select auth.uid()) = creator_id);

-- Column privileges: funded_by_gift_id and funded_at are deliberately absent
-- from every client write grant — only the service role sets them (and the
-- 'funded' status they gate). image_url is granted so the image route can set
-- it via the session client, mirroring goal covers.
revoke all on public.wishlist_items from anon, authenticated;
grant select on public.wishlist_items to anon, authenticated;
grant insert (creator_id, title, description, image_url, currency, price_amount, status, sort_order)
  on public.wishlist_items to authenticated;
grant update (title, description, image_url, currency, price_amount, status, sort_order)
  on public.wishlist_items to authenticated;
grant delete on public.wishlist_items to authenticated;

-- ---------------------------------------------------------------------------
-- Gift attribution seam
-- ---------------------------------------------------------------------------

-- Items with any referencing gift cannot be deleted (archive instead);
-- draft-only items remain deletable because no gift can reference them yet
-- (checkout only accepts active items).
alter table public.gifts
  add column wishlist_item_id uuid references public.wishlist_items (id) on delete restrict;

comment on column public.gifts.wishlist_item_id is
  'Optional: the wish-list item this gift funds. Set at checkout; must be an active item of the recipient, paid at exactly its price. Mutually exclusive with goal_id.';

-- A gift funds at most one thing: a goal OR a wish-list item, never both.
alter table public.gifts
  add constraint gifts_single_attribution
    check (goal_id is null or wishlist_item_id is null);

create index gifts_wishlist_item_idx
  on public.gifts (wishlist_item_id) where wishlist_item_id is not null;

grant select (wishlist_item_id) on public.gifts to authenticated;
