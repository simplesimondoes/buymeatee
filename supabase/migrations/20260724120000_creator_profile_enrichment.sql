-- BuyMeATee creator profile enrichment (Product Wave 1 — profile polish)
--
-- Richer public creator pages to match the brand renders:
--   1. profiles: cover image, golf fields (handicap, location, home club,
--      handedness) and social links.
--   2. creator_goals: per-goal cover image.
--   3. `covers` storage bucket for profile + goal cover images.
--
-- IMPORTANT: profiles and creator_goals carry column-level grants (added in
-- the admin + goals migrations) — every NEW writable column must be granted
-- to `authenticated` here, or client updates fail with permission denied.

-- ---------------------------------------------------------------------------
-- Profile columns
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column cover_image_url   text
    check (char_length(cover_image_url) <= 500),
  -- Golf handicap index: plus handicaps are negative; caps at the WHS max.
  add column handicap          numeric(3,1)
    check (handicap >= -10 and handicap <= 54),
  add column location          text
    check (char_length(location) <= 120),
  add column home_club         text
    check (char_length(home_club) <= 120),
  add column handedness        text
    check (handedness in ('left', 'right')),
  add column social_youtube    text
    check (char_length(social_youtube) <= 300),
  add column social_instagram  text
    check (char_length(social_instagram) <= 300),
  add column social_tiktok     text
    check (char_length(social_tiktok) <= 300),
  add column social_website    text
    check (char_length(social_website) <= 300);

comment on column public.profiles.handicap is
  'WHS handicap index; negative for plus handicaps. Display only.';

-- Extend the client write grants to the new columns (deactivated_at stays
-- excluded — admins only). GRANT is additive; existing columns keep theirs.
grant insert (cover_image_url, handicap, location, home_club, handedness,
              social_youtube, social_instagram, social_tiktok, social_website)
  on public.profiles to authenticated;
grant update (cover_image_url, handicap, location, home_club, handedness,
              social_youtube, social_instagram, social_tiktok, social_website)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Goal cover image
-- ---------------------------------------------------------------------------

alter table public.creator_goals
  add column cover_image_url text
    check (char_length(cover_image_url) <= 500);

grant insert (cover_image_url) on public.creator_goals to authenticated;
grant update (cover_image_url) on public.creator_goals to authenticated;

-- ---------------------------------------------------------------------------
-- Covers storage bucket (profile + goal cover images)
-- ---------------------------------------------------------------------------
-- Public-read, like `avatars`. Objects live under `{user_id}/…`; only that
-- user may write inside their own folder. 5 MB (covers are wider than
-- avatars); mirrored in lib/profile/cover.ts.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers',
  'covers',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Users can upload their own cover"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can replace their own cover"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can remove their own cover"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Cover objects are viewable by everyone"
  on storage.objects for select
  using (bucket_id = 'covers');
