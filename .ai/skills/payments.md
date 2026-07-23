# Skill: Payments (Stripe Connect)

> **Status: implemented (July 2026, ADR-009/ADR-010).** How money moves in
> this repository. Operational manual: [docs/stripe-connect-setup.md](../../docs/stripe-connect-setup.md).

## Non-negotiables

- **Integer minor units everywhere.** £5.00 = 500. No floats near money —
  string-parse user/env input (`parseMajorAmountToMinor`, `readPercentEnvAsBps`).
- **One fee authority.** `lib/payments/fees.ts` (pure) + `lib/payments/config.ts`
  (env). UI shows estimates from the same function; the server recalculates.
  Never scatter fee maths into components. Pricing changes bump
  `FEE_MODEL_VERSION`.
- **Only the webhook marks gifts paid.** Success pages/redirects read status;
  they never write it. Paid transitions verify amount, currency, destination
  and application fee first — mismatches become `reconciliation_error`.
- **Never trust the client** for amounts, totals, recipient Stripe account ids
  or payment state. Recipients resolve from usernames server-side.
- **Secrets stay server-side**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `SUPABASE_SERVICE_ROLE_KEY` are only read in `server-only` modules.
- **Test/live separation**: `livemode` column on financial rows; webhook
  refuses events whose livemode mismatches the key.

## Module map

| Module | Role |
| --- | --- |
| `lib/payments/fees.ts`, `currency.ts`, `gift-schema.ts` | Pure: calculation, minor units, validation (client-shareable) |
| `lib/payments/config.ts` | Server: env-backed fee model, URLs, countries, presets |
| `lib/payments/connect.ts` | Connected accounts: create (controller model, `transfers` only), account links, dashboard login links, status sync |
| `lib/payments/gifts.ts` | Gift + Checkout Session creation (destination charge), safe public status projection, audit events |
| `lib/payments/webhooks.ts` | Event handlers incl. the single verified paid path |
| `lib/payments/admin.ts`, `reconciliation.ts` | Admin membership, search, full refunds (`reverse_transfer` + `refund_application_fee`), stuck-gift repair |
| `lib/notifications/gift-notifications.ts` | Idempotent queue boundary (no email provider yet) |
| `lib/stripe/server.ts`, `lib/supabase/{server,admin,browser}.ts` | Clients; admin client bypasses RLS — trusted code only |
| `app/api/stripe/webhooks` | Raw body + signature verify + idempotency ledger |

## Database conventions

All payment tables are RLS-enabled with **no client write policies** — writes
go through the service role. Client reads use explicit column lists because
column-level grants strip sensitive fields (donor emails, Stripe ids,
requirement lists); `select *` from the browser fails by design. Admins live
in `admin_users` (inserted manually, checked server-side per request).

## Auth

Magic links only (`/sign-in` → `signInWithOtp` → `/auth/callback`). Middleware
matcher covers only authed areas + payment APIs so marketing pages stay
static. Post-auth redirects go through `safeRelativePath` (no open redirects).

## Testing

`npm run test` covers fees (rounding/bounds/currencies), schema validation,
webhook processing (verified paid, mismatch flagging, idempotent
notifications, refunds, disputes, account sync), webhook route (real
signature construction, duplicate ledger, livemode refusal) and route
authorisation. Stripe CLI flows: see the setup doc. Webhook logic lives in
`lib/payments/webhooks.ts` precisely so it is testable without HTTP.
