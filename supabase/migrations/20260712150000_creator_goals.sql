-- BuyMeATee creator goals + gift attribution seam (ADR-011)
--
-- 1. public.creator_goals — a Creator's real Goals with verified progress
-- 2. public.gifts.goal_id — optional attribution of a gift to one Goal
-- 3. public.apply_goal_contribution() — the ONLY way raised amounts change
--
-- Progress model: raised_amount is denormalised and maintained exclusively by
-- trusted server code (service role) from the verified Stripe webhook path.
-- Clients — including the goal's owner — can never write it: there is no
-- column grant for it. Amounts are integer minor units. Never floats.

-- ---------------------------------------------------------------------------
-- Enum + table
-- ---------------------------------------------------------------------------

create type public.goal_status as enum ('draft', 'active', 'completed', 'archived');

create table public.creator_goals (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references public.profiles (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 120),
  description   text check (char_length(description) <= 1000),
  currency      public.payment_currency not null,
  -- Integer minor units (pence / cents).
  target_amount integer not null check (target_amount > 0),
  -- Webhook-maintained. Over-target is allowed and displayed honestly.
  raised_amount integer not null default 0 check (raised_amount >= 0),
  status        public.goal_status not null default 'draft',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.creator_goals is
  'A Creator''s Goals. raised_amount changes only via apply_goal_contribution() from verified webhook processing — never from clients.';
comment on column public.creator_goals.raised_amount is
  'Minor units, service-role only. No client column grant exists on purpose.';

create index creator_goals_creator_idx
  on public.creator_goals (creator_id, status, sort_order, created_at);

create trigger creator_goals_set_updated_at
  before update on public.creator_goals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Integrity triggers (defence in depth; server code enforces these first)
-- ---------------------------------------------------------------------------

-- At most 3 active goals per creator. The advisory limit lives in
-- lib/goals/types.ts (MAX_ACTIVE_GOALS) — keep the two in sync.
create or replace function public.enforce_active_goal_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'active' then
    if (
      select count(*)
      from public.creator_goals
      where creator_id = new.creator_id
        and status = 'active'
        and id <> new.id
    ) >= 3 then
      raise exception 'A creator can have at most 3 active goals.';
    end if;
  end if;
  return new;
end;
$$;

create trigger creator_goals_active_limit
  before insert or update on public.creator_goals
  for each row execute function public.enforce_active_goal_limit();

-- Once money has been attributed, the goal's financial identity is frozen.
create or replace function public.prevent_funded_goal_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.raised_amount > 0 and new.currency is distinct from old.currency then
    raise exception 'A goal with attributed support cannot change currency.';
  end if;
  return new;
end;
$$;

create trigger creator_goals_prevent_funded_mutation
  before update on public.creator_goals
  for each row execute function public.prevent_funded_goal_mutation();

-- ---------------------------------------------------------------------------
-- Row-level security + column privileges
-- ---------------------------------------------------------------------------

alter table public.creator_goals enable row level security;

-- Anyone may read goals a creator has published; drafts and archived goals
-- are visible to their owner only.
create policy "Published goals are viewable by everyone"
  on public.creator_goals for select
  using (status in ('active', 'completed'));

create policy "Creators can view all their own goals"
  on public.creator_goals for select
  using ((select auth.uid()) = creator_id);

create policy "Creators can insert their own goals"
  on public.creator_goals for insert
  with check ((select auth.uid()) = creator_id);

create policy "Creators can update their own goals"
  on public.creator_goals for update
  using ((select auth.uid()) = creator_id)
  with check ((select auth.uid()) = creator_id);

create policy "Creators can delete their own goals"
  on public.creator_goals for delete
  using ((select auth.uid()) = creator_id);

-- Column privileges: raised_amount is deliberately absent from every client
-- write grant — only the service role can change it (via the function below).
revoke all on public.creator_goals from anon, authenticated;
grant select on public.creator_goals to anon, authenticated;
grant insert (creator_id, title, description, currency, target_amount, status, sort_order)
  on public.creator_goals to authenticated;
grant update (title, description, currency, target_amount, status, sort_order)
  on public.creator_goals to authenticated;
grant delete on public.creator_goals to authenticated;

-- ---------------------------------------------------------------------------
-- Gift attribution seam (schema only — behaviour ships separately)
-- ---------------------------------------------------------------------------

-- Goals with any referencing gift cannot be deleted (archive instead);
-- draft-only goals remain deletable because no gift can reference them yet
-- (checkout only accepts active goals).
alter table public.gifts
  add column goal_id uuid references public.creator_goals (id) on delete restrict;

comment on column public.gifts.goal_id is
  'Optional: the Goal this gift supports. Set at checkout; must be an active goal of the recipient.';

create index gifts_goal_idx on public.gifts (goal_id) where goal_id is not null;

grant select (goal_id) on public.gifts to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic progress updates
-- ---------------------------------------------------------------------------

-- The single write path for raised_amount. Positive delta on verified
-- payment, negative on refund/dispute withdrawal. Atomic by construction
-- (single UPDATE); the >= 0 check constraint rejects over-refunds.
create or replace function public.apply_goal_contribution(
  p_goal_id uuid,
  p_delta   integer
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_raised integer;
begin
  update public.creator_goals
    set raised_amount = raised_amount + p_delta
    where id = p_goal_id
    returning raised_amount into v_raised;
  if v_raised is null then
    raise exception 'Goal % does not exist.', p_goal_id;
  end if;
  return v_raised;
end;
$$;

comment on function public.apply_goal_contribution is
  'Service-role only: atomically adjust a goal''s raised_amount from verified webhook processing.';

revoke execute on function public.apply_goal_contribution(uuid, integer)
  from public, anon, authenticated;
