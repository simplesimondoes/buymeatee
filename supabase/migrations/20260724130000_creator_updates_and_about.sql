-- BuyMeATee creator profile v2 — About + Project Updates
--
--   1. profiles.about — a longer, markdown "about the creator" section.
--   2. public.creator_updates — creator-authored progress posts (markdown),
--      published newest-first on the public page.
--
-- Markdown is rendered through a sanitising pipeline in the app (ADR-014);
-- the database stores the raw source. Column-level grants must list every new
-- writable column (profiles/creator_goals precedent), or client writes fail.

-- ---------------------------------------------------------------------------
-- About (markdown)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column about text check (char_length(about) <= 5000);

grant insert (about) on public.profiles to authenticated;
grant update (about) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Project updates
-- ---------------------------------------------------------------------------

create table public.creator_updates (
  id           uuid primary key default gen_random_uuid(),
  creator_id   uuid not null references public.profiles (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 200),
  body         text not null check (char_length(body) <= 10000),
  image_url    text check (char_length(image_url) <= 500),
  status       text not null default 'draft'
               check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index creator_updates_creator_published_idx
  on public.creator_updates (creator_id, published_at desc);

create trigger creator_updates_set_updated_at
  before update on public.creator_updates
  for each row execute function public.set_updated_at();

alter table public.creator_updates enable row level security;

-- Published updates of an active creator are public; owners always see their own.
create policy "Published updates are viewable by everyone"
  on public.creator_updates for select
  using (
    (status = 'published'
      and exists (
        select 1 from public.profiles p
        where p.id = creator_id and p.deactivated_at is null
      ))
    or (select auth.uid()) = creator_id
  );

create policy "Creators insert their own updates"
  on public.creator_updates for insert
  with check ((select auth.uid()) = creator_id);

create policy "Creators update their own updates"
  on public.creator_updates for update
  using ((select auth.uid()) = creator_id)
  with check ((select auth.uid()) = creator_id);

create policy "Creators delete their own updates"
  on public.creator_updates for delete
  using ((select auth.uid()) = creator_id);

-- Explicit column grants (consistent with profiles/creator_goals): clients
-- may set content columns, never the id/timestamps.
revoke insert, update on public.creator_updates from anon, authenticated;
grant insert (creator_id, title, body, image_url, status, published_at)
  on public.creator_updates to authenticated;
grant update (title, body, image_url, status, published_at)
  on public.creator_updates to authenticated;
grant select, delete on public.creator_updates to authenticated;
grant select on public.creator_updates to anon;
