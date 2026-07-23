-- BuyMeATee foundation schema (ADR-008)
--
-- 1. public.profiles             — one row per auth user, auto-created on sign-up
-- 2. public.early_access_signups — sign-up emails from the marketing site form
--
-- Field shapes mirror lib/early-access/schema.ts (role enum, length limits).

-- ---------------------------------------------------------------------------
-- Shared: user role enum + updated_at helper
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('creator', 'supporter');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique
               check (username ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$'),
  display_name text not null default '' check (char_length(display_name) <= 200),
  avatar_url   text check (char_length(avatar_url) <= 500),
  bio          text check (char_length(bio) <= 1000),
  country      text check (char_length(country) <= 200),
  role         public.user_role not null default 'supporter',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Public profile per auth user. Created automatically by handle_new_user().';
comment on column public.profiles.username is
  'URL slug for creator pages: lowercase letters, digits, inner hyphens, 3-40 chars.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Profiles are public (creator pages must be readable by anyone).
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users manage only their own row. Inserts happen via the auth trigger below,
-- but allow self-insert as a fallback (e.g. backfill after trigger failure).
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Auto-create a profile whenever a user signs up. Reads optional metadata
-- passed at sign-up time (display_name / full_name, role).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1),
      ''
    ),
    case new.raw_user_meta_data ->> 'role'
      when 'creator' then 'creator'::public.user_role
      else 'supporter'::public.user_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Early-access sign-ups (marketing site form)
-- ---------------------------------------------------------------------------

create table public.early_access_signups (
  id           uuid primary key default gen_random_uuid(),
  role         public.user_role not null,
  name         text not null check (char_length(name) between 1 and 200),
  email        text not null check (char_length(email) <= 200),
  country      text not null check (char_length(country) between 1 and 200),
  profile_link text check (char_length(profile_link) <= 200),
  use_case     text check (char_length(use_case) <= 1000),
  consent      boolean not null default true check (consent = true),
  source       text not null default 'buymeatee.com early-access form',
  created_at   timestamptz not null default now()
);

comment on table public.early_access_signups is
  'Early-access form submissions. Written only via the service role (API route); no client access.';

-- One row per email address; repeat submissions should upsert.
create unique index early_access_signups_email_key
  on public.early_access_signups (lower(email));

-- RLS on with no policies: anon/authenticated clients get nothing.
-- Only the service-role key (server-side API route) can read or write.
alter table public.early_access_signups enable row level security;
