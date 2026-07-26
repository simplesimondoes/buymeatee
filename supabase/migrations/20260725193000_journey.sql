-- BuyMeATee Journey (Phase 2 — core slice)
--
-- Evolves the flat creator_updates feed into a richer "Journey": a lightweight
-- social timeline of a golfer's progress with photos, milestone badges, likes
-- and comments. Decisions:
--   * The existing creator_updates table IS the journey feed — we rename it
--     (data, RLS policies, index and trigger all follow the rename) rather than
--     stand up a parallel table.
--   * Likes/comments are SIGNED-IN ONLY (magic-link auth). One like per user;
--     the post's creator may moderate (delete) any comment on their own posts.
--   * Milestone posts (goal 25/50/75/100%) are created as DRAFTS by the verified
--     webhook path only — never auto-published, never client-invented. The
--     milestone identity columns (milestone_goal_id/percent) and the counters
--     have no client write grant, mirroring raised_amount (ADR-011) and
--     wishlist funded_by_gift_id (ADR-018).
--
-- Markdown bodies are stored raw and rendered only through the sanitising
-- <Markdown> pipeline (ADR-014). Column-level grants must list every new
-- writable column or client writes fail (profiles/creator_goals precedent).

-- ---------------------------------------------------------------------------
-- 1. Rename + extend the feed
-- ---------------------------------------------------------------------------

alter table public.creator_updates rename to journey_posts;

-- Photo-only or milestone posts don't need a headline.
alter table public.journey_posts alter column title drop not null;

alter table public.journey_posts
  add column kind text not null default 'update'
    check (kind in ('update', 'milestone')),
  -- Optional link to a goal this post is about (set null if the goal is deleted).
  add column goal_id uuid references public.creator_goals (id) on delete set null,
  -- Optional YouTube URL; validated to a YouTube host + id in lib/journey before
  -- it is ever embedded (ADR-014), never interpolated raw into an iframe.
  add column video_url text check (char_length(video_url) <= 500),
  -- Human label for milestone posts, e.g. "Goal reached 50%". UGC-free (server
  -- or creator authored), never translated for display of user goal titles.
  add column milestone_label text check (char_length(milestone_label) <= 120),
  -- Milestone identity. Service-role only (no client grant) so a creator can
  -- never invent a funding milestone. The partial unique index makes automatic
  -- milestone drafts idempotent under webhook retries.
  add column milestone_goal_id uuid references public.creator_goals (id) on delete set null,
  add column milestone_percent int check (milestone_percent in (25, 50, 75, 100)),
  -- Denormalised interaction counters. Maintained by SECURITY DEFINER triggers
  -- only; clients have no write grant, so the numbers can never be inflated.
  add column like_count int not null default 0,
  add column comment_count int not null default 0;

comment on table public.journey_posts is
  'A creator''s Journey timeline (evolved from creator_updates, Phase 2). Milestone posts and interaction counters are written only by the verified server path.';
comment on column public.journey_posts.milestone_goal_id is
  'The goal whose progress produced this milestone. Service-role only; no client grant — a creator cannot fabricate a milestone.';

-- One automatic milestone draft per (goal, threshold). Webhook replays that try
-- to insert the same milestone hit this and are ignored.
create unique index journey_posts_goal_milestone_uk
  on public.journey_posts (milestone_goal_id, milestone_percent)
  where milestone_percent is not null;

create index journey_posts_goal_idx
  on public.journey_posts (goal_id) where goal_id is not null;

-- Extend the client column grants to the new *writable* creator columns. The
-- server-owned columns (like_count, comment_count, milestone_goal_id,
-- milestone_percent) are deliberately absent from every grant below.
grant insert (creator_id, title, body, image_url, status, published_at, kind, goal_id, video_url, milestone_label)
  on public.journey_posts to authenticated;
grant update (title, body, image_url, status, published_at, kind, goal_id, video_url, milestone_label)
  on public.journey_posts to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Journey media (multiple images per post)
-- ---------------------------------------------------------------------------

create table public.journey_media (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.journey_posts (id) on delete cascade,
  url        text not null check (char_length(url) <= 500),
  width      int check (width > 0),
  height     int check (height > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index journey_media_post_idx
  on public.journey_media (post_id, sort_order);

alter table public.journey_media enable row level security;

-- Readable whenever the parent post is publicly visible (published + active
-- creator), or by the post's owner.
create policy "Journey media follows post visibility"
  on public.journey_media for select
  using (
    exists (
      select 1
      from public.journey_posts jp
      join public.profiles p on p.id = jp.creator_id
      where jp.id = post_id
        and (
          (jp.status = 'published' and p.deactivated_at is null)
          or (select auth.uid()) = jp.creator_id
        )
    )
  );

create policy "Creators manage media on their own posts"
  on public.journey_media for all
  using (
    exists (
      select 1 from public.journey_posts jp
      where jp.id = post_id and (select auth.uid()) = jp.creator_id
    )
  )
  with check (
    exists (
      select 1 from public.journey_posts jp
      where jp.id = post_id and (select auth.uid()) = jp.creator_id
    )
  );

revoke all on public.journey_media from anon, authenticated;
grant select on public.journey_media to anon, authenticated;
grant insert (post_id, url, width, height, sort_order) on public.journey_media to authenticated;
grant update (url, width, height, sort_order) on public.journey_media to authenticated;
grant delete on public.journey_media to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Journey comments (signed-in supporters; creator can moderate)
-- ---------------------------------------------------------------------------

create table public.journey_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.journey_posts (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index journey_comments_post_idx
  on public.journey_comments (post_id, created_at);

create trigger journey_comments_set_updated_at
  before update on public.journey_comments
  for each row execute function public.set_updated_at();

alter table public.journey_comments enable row level security;

-- Public sees non-deleted comments on publicly visible posts. The author and
-- the post's creator additionally see their own / all (for moderation).
create policy "Comments on public posts are viewable by everyone"
  on public.journey_comments for select
  using (
    (
      deleted_at is null
      and exists (
        select 1
        from public.journey_posts jp
        join public.profiles p on p.id = jp.creator_id
        where jp.id = post_id
          and jp.status = 'published'
          and p.deactivated_at is null
      )
    )
    or (select auth.uid()) = author_id
    or exists (
      select 1 from public.journey_posts jp
      where jp.id = post_id and (select auth.uid()) = jp.creator_id
    )
  );

-- Any signed-in user may comment as themselves, on a publicly visible post.
create policy "Signed-in users comment as themselves"
  on public.journey_comments for insert
  with check (
    (select auth.uid()) = author_id
    and exists (
      select 1
      from public.journey_posts jp
      join public.profiles p on p.id = jp.creator_id
      where jp.id = post_id
        and jp.status = 'published'
        and p.deactivated_at is null
    )
  );

-- Soft-delete: the author or the post's creator (moderation) may set deleted_at.
create policy "Authors and post creators can moderate comments"
  on public.journey_comments for update
  using (
    (select auth.uid()) = author_id
    or exists (
      select 1 from public.journey_posts jp
      where jp.id = post_id and (select auth.uid()) = jp.creator_id
    )
  )
  with check (
    (select auth.uid()) = author_id
    or exists (
      select 1 from public.journey_posts jp
      where jp.id = post_id and (select auth.uid()) = jp.creator_id
    )
  );

create policy "Authors and post creators can delete comments"
  on public.journey_comments for delete
  using (
    (select auth.uid()) = author_id
    or exists (
      select 1 from public.journey_posts jp
      where jp.id = post_id and (select auth.uid()) = jp.creator_id
    )
  );

revoke all on public.journey_comments from anon, authenticated;
grant select on public.journey_comments to anon, authenticated;
grant insert (post_id, author_id, body) on public.journey_comments to authenticated;
-- Moderation is soft-delete only from clients: deleted_at is the sole updatable column.
grant update (deleted_at) on public.journey_comments to authenticated;
grant delete on public.journey_comments to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Journey likes (one per user per post)
-- ---------------------------------------------------------------------------

create table public.journey_likes (
  post_id    uuid not null references public.journey_posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.journey_likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.journey_likes for select
  using (true);

create policy "Signed-in users like as themselves"
  on public.journey_likes for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.journey_posts jp
      join public.profiles p on p.id = jp.creator_id
      where jp.id = post_id
        and jp.status = 'published'
        and p.deactivated_at is null
    )
  );

create policy "Users remove their own like"
  on public.journey_likes for delete
  using ((select auth.uid()) = user_id);

revoke all on public.journey_likes from anon, authenticated;
grant select on public.journey_likes to anon, authenticated;
grant insert (post_id, user_id) on public.journey_likes to authenticated;
grant delete on public.journey_likes to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Denormalised counters (SECURITY DEFINER so cross-row bumps bypass the
--    liker/commenter's own RLS — the counter columns have no client grant).
-- ---------------------------------------------------------------------------

create or replace function public.journey_bump_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.journey_posts
      set like_count = like_count + 1
      where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.journey_posts
      set like_count = greatest(like_count - 1, 0)
      where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger journey_likes_count_ins
  after insert on public.journey_likes
  for each row execute function public.journey_bump_like_count();

create trigger journey_likes_count_del
  after delete on public.journey_likes
  for each row execute function public.journey_bump_like_count();

create or replace function public.journey_bump_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.deleted_at is null then
      update public.journey_posts
        set comment_count = comment_count + 1
        where id = new.post_id;
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    -- Only a change in soft-delete state moves the count.
    if old.deleted_at is null and new.deleted_at is not null then
      update public.journey_posts
        set comment_count = greatest(comment_count - 1, 0)
        where id = new.post_id;
    elsif old.deleted_at is not null and new.deleted_at is null then
      update public.journey_posts
        set comment_count = comment_count + 1
        where id = new.post_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.deleted_at is null then
      update public.journey_posts
        set comment_count = greatest(comment_count - 1, 0)
        where id = old.post_id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

create trigger journey_comments_count_ins
  after insert on public.journey_comments
  for each row execute function public.journey_bump_comment_count();

create trigger journey_comments_count_upd
  after update of deleted_at on public.journey_comments
  for each row execute function public.journey_bump_comment_count();

create trigger journey_comments_count_del
  after delete on public.journey_comments
  for each row execute function public.journey_bump_comment_count();
