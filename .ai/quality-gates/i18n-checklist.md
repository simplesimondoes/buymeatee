# Internationalisation checklist (ADR-019)

Apply to every feature or copy change. Full guide: [docs/i18n.md](../../docs/i18n.md).

## Strings

- [ ] Every user-facing string (headings, buttons, placeholders, empty/loading
      states, aria-labels, sr-only text, alt text, toasts) lives in
      `messages/en/<namespace>.json` — no hardcoded English in JSX
- [ ] Keys are semantic and stable; full sentences with ICU interpolation —
      no concatenated fragments
- [ ] Counts use ICU plurals (`{count, plural, one {…} other {…}}`)
- [ ] All 8 locales updated (parity is enforced: `npm run i18n:check` fails on
      missing keys for complete locales)
- [ ] User-generated content is never machine-translated; labels around it are

## Errors & validation

- [ ] Schemas return `ErrorDetail` codes (`lib/i18n/errors.ts`), never sentences
- [ ] API routes use `apiError()` (`lib/api/errors.ts`); raw provider errors
      logged, never surfaced
- [ ] Clients render via `useErrorMessage()`

## Formatting

- [ ] Currency/dates/numbers via `lib/i18n/format.ts` (or next-intl formatters)
      — no hardcoded locales, no manual separators
- [ ] Amounts stored canonically (integer minor units); localisation is
      display-only

## Routing & SEO

- [ ] New pages live under `app/[locale]/`, call `setRequestLocale`, and use
      `generateMetadata` with translated title/description
- [ ] Indexable pages: self-referencing locale canonical + hreflang (via
      `pageMetadata`); added to `app/sitemap.ts` if static & public
- [ ] Noindex surfaces pass `noHreflang: true` and keep noindex
- [ ] Internal links use `Link`/`redirect` from `@/i18n/navigation`

## Client bundles

- [ ] Client components get their namespaces via `<ClientMessages>` — never
      the whole catalog

## Emails

- [ ] New emails render per recipient locale (creator: `preferred_locale` at
      delivery time; supporter: `gifts.locale`), locale-prefixed CTAs,
      `<html lang>` set

## Layout QA

- [ ] Checked at 375/768/1024/1440 in de (long words) and ja/ko (CJK
      wrapping, no hostile letter-spacing)
- [ ] `npm run i18n:check`, `npm run test`, `npm run lint`, `npm run build`
      all green
