-- BuyMeATee creator profile v2 — Pinned Media
--
-- One "pinned" media URL per creator (a YouTube video, Instagram post, or a
-- website/blog link). Rendered as a hardened embed (YouTube/Instagram) or a
-- link card, resolved by lib/profile/pinned-media.ts. Column-level grant must
-- be added (profiles lockdown precedent).

alter table public.profiles
  add column pinned_media_url text
    check (char_length(pinned_media_url) <= 500);

grant insert (pinned_media_url) on public.profiles to authenticated;
grant update (pinned_media_url) on public.profiles to authenticated;
