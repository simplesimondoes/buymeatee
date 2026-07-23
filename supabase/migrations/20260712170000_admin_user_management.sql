-- BuyMeATee admin user management (Product Wave 1, issue #27)
--
-- 1. profiles.deactivated_at — platform-level unpublish of a creator
-- 2. public.admin_actions    — append-only audit log of every admin action
--
-- Deactivation reasons are deliberately NOT on profiles (which is publicly
-- readable) — they live in admin_actions, which no client role can read.

-- ---------------------------------------------------------------------------
-- Profile deactivation
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column deactivated_at timestamptz;

comment on column public.profiles.deactivated_at is
  'Set by admins only. A deactivated profile has no public page and cannot receive gifts.';

-- Deactivated profiles disappear from public reads; the owner still sees
-- their own row (their sign-in and settings keep working).
drop policy "Profiles are viewable by everyone" on public.profiles;
create policy "Active profiles are viewable by everyone"
  on public.profiles for select
  using (deactivated_at is null or (select auth.uid()) = id);

-- Published goals of a deactivated creator are hidden with them.
drop policy "Published goals are viewable by everyone" on public.creator_goals;
create policy "Published goals of active creators are viewable by everyone"
  on public.creator_goals for select
  using (
    status in ('active', 'completed')
    and exists (
      select 1 from public.profiles p
      where p.id = creator_id and p.deactivated_at is null
    )
  );

-- Column privileges: users must not be able to lift (or set) their own
-- deactivation. Replace the blanket default grants with explicit ones that
-- exclude deactivated_at from every client write path.
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, username, display_name, avatar_url, bio, country, role)
  on public.profiles to authenticated;
grant update (username, display_name, avatar_url, bio, country, role)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Admin action audit log
-- ---------------------------------------------------------------------------

create table public.admin_actions (
  id             bigint generated always as identity primary key,
  admin_user_id  uuid not null references public.profiles (id) on delete restrict,
  action         text not null,
  target_user_id uuid references public.profiles (id) on delete set null,
  target_goal_id uuid references public.creator_goals (id) on delete set null,
  reason         text not null check (char_length(reason) between 1 and 500),
  detail         jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

comment on table public.admin_actions is
  'Append-only audit trail of admin actions (deactivations, takedowns, reinstatements). Service-role only; never exposed to clients.';

create index admin_actions_target_user_idx
  on public.admin_actions (target_user_id, created_at desc);

-- RLS on, no policies: service-role only.
alter table public.admin_actions enable row level security;
revoke all on public.admin_actions from anon, authenticated;
