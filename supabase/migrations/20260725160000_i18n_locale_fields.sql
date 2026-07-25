-- BuyMeATee internationalisation (ADR-019) — locale persistence
--
-- Two additive columns; no existing data is rewritten:
--
-- 1. profiles.preferred_locale — the user's chosen UI language. NULL means
--    "never explicitly chose"; renderers fall back to 'en'. Written by the
--    signed-in user via the language switcher (/api/profile PATCH), read at
--    email-delivery time so creator notifications arrive in their language.
--
-- 2. gifts.locale — the supporter's UI language captured at checkout
--    creation (supporters may have no account, so it cannot live on a
--    profile). Read when sending the gift receipt email. NULL (all existing
--    rows) falls back to 'en'. Written only by the server (service role) in
--    createGiftCheckout; no client grant, matching the rest of gifts.
--
-- The allowlist mirrors i18n/locales.ts. Adding a locale later requires
-- extending these checks (a follow-up migration) — deliberate, so the
-- database never stores a language the app cannot render.

alter table public.profiles
  add column if not exists preferred_locale text
    check (
      preferred_locale is null
      or preferred_locale in ('en','de','fr','es','it','ja','ko','pt')
    );

-- profiles carries column-level grants (ADR-027 lockdown): every new
-- client-writable column must be granted to `authenticated`, or client
-- updates fail with permission denied.
grant insert (preferred_locale) on public.profiles to authenticated;
grant update (preferred_locale) on public.profiles to authenticated;

alter table public.gifts
  add column if not exists locale text
    check (
      locale is null
      or locale in ('en','de','fr','es','it','ja','ko','pt')
    );

-- No client grants on gifts.locale: gifts are written exclusively through
-- the service-role checkout path.
