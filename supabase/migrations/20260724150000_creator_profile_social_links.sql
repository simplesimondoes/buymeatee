-- BuyMeATee creator profile social links (Product Wave 1 — profile polish)
--
-- Extends the Links section beyond YouTube / Instagram / TikTok / Website with
-- six more platforms creators asked for: X (Twitter), Bluesky, Substack,
-- Facebook, Twitch and LinkedIn. Same shape as the existing social columns
-- (300-char https URLs, host-validated in lib/profile/profile-schema.ts).
--
-- IMPORTANT: profiles carries column-level grants (ADR-027 lockdown) — every
-- NEW writable column must be granted to `authenticated` here, or client
-- updates fail with permission denied.

alter table public.profiles
  add column social_x         text
    check (char_length(social_x) <= 300),
  add column social_bluesky   text
    check (char_length(social_bluesky) <= 300),
  add column social_substack  text
    check (char_length(social_substack) <= 300),
  add column social_facebook  text
    check (char_length(social_facebook) <= 300),
  add column social_twitch    text
    check (char_length(social_twitch) <= 300),
  add column social_linkedin  text
    check (char_length(social_linkedin) <= 300);

-- Extend the client write grants to the new columns (GRANT is additive;
-- existing columns keep theirs).
grant insert (social_x, social_bluesky, social_substack, social_facebook,
              social_twitch, social_linkedin)
  on public.profiles to authenticated;
grant update (social_x, social_bluesky, social_substack, social_facebook,
              social_twitch, social_linkedin)
  on public.profiles to authenticated;
