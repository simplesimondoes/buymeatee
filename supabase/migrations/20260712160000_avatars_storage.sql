-- BuyMeATee avatar storage (ADR-012)
--
-- Public-read `avatars` bucket. Objects live under `{user_id}/…` and only
-- that user can write inside their own folder — enforced here by storage RLS
-- on top of the server-side MIME/size validation in the upload route.
-- Uploads overwrite in place (one object per user), so replaced avatars
-- never orphan.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB, mirrored in lib/profile/avatar.ts (AVATAR_MAX_BYTES)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Path convention: <auth.uid()>/avatar — the first folder segment must be
-- the owner's user id for every write.
create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can replace their own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can remove their own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Reads go through the public bucket URL; an explicit select policy keeps
-- the client SDK's list/download working for the owner.
create policy "Avatar objects are viewable by everyone"
  on storage.objects for select
  using (bucket_id = 'avatars');
