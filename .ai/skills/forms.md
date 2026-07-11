# Skill: Forms (Early Access)

> **Status: planned.** The early-access form does not exist yet. This documents the agreed architecture; update with real file paths and the chosen provider when built.

## Structure

Two selectable routes — "I'm a golf creator" and "I'm a supporter" — collecting: name, email, role, country, optional creator profile/social link, optional answer to "What would you use BuyMeATee for?". Nothing more; personal-data collection stays minimal.

## Service boundary

Submission goes through a single isolated service module (not inline fetch calls in components) so the provider is swappable:

- Typed input schema shared between client and server.
- Server-side validation wherever submission is processed.
- Configurable endpoint via `EARLY_ACCESS_API_URL` (server-side env var — no private keys in client code).
- **If no endpoint is configured, show a graceful, honest alternative — never fake success.**
- Future providers to document when chosen: Supabase, Formspree, Loops, ConvertKit or similar. Choosing one that implies persistence/architecture → ADR.

## Environment

```env
NEXT_PUBLIC_SITE_URL=https://buymeatee.com
EARLY_ACCESS_API_URL=
```

Keep `.env.example` current; never commit secrets.

## States

Validation feedback (client for UX, server for trust), loading state, honest success state, honest error state. Error messages associated with fields for screen readers.

## Consent and privacy

Consent text describing actual use, with a link to `/privacy`. The privacy draft must match what the form really collects and where it goes.

## Spam resistance

Document considerations when implementing: honeypot field, minimal rate limiting at the handler, no open redirect of user content. Avoid CAPTCHA unless spam is demonstrated.

## No sensitive logging

Never log submitted personal data.
