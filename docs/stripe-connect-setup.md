# Stripe Connect setup — BuyMeATee

Operational manual for the payment system implemented in July 2026 (ADR-009).
Code cannot complete the Stripe Dashboard steps below — they are owner actions.

## Architecture in one paragraph

Donors pay through **Stripe-hosted Checkout** on the BuyMeATee platform
account. Each payment is a **destination charge**: `transfer_data.destination`
points at the recipient's **connected account** (controller model, Express
dashboard, `transfers` capability only) and `application_fee_amount` retains
the BuyMeATee platform fee plus the payment-handling amount. The recipient's
transfer therefore always equals the chosen gift amount. Supabase stores every
gift; a signature-verified webhook is the only thing that ever marks a gift
paid. BuyMeATee never holds recipient money and never collects card details.

## Fee model (documented commercial assumptions)

Configured in `lib/payments/config.ts` via env vars; calculated only in
`lib/payments/fees.ts`; stamped on each gift as `fee_model_version`.

```
totalChargeAmount     = giftAmount + platformFeeAmount + paymentHandlingAmount
applicationFeeAmount  = platformFeeAmount + paymentHandlingAmount
recipientTargetAmount = giftAmount        (always)
```

- Platform fee: 5% of the gift (`STRIPE_PLATFORM_FEE_BPS=500`), added on top.
- Payment handling: a grossed-up estimate of Stripe's processing charge on the
  whole total (default 1.5% + 20p/25c). Stripe's real fee varies by card and
  country, so the UI says "estimated card-processing costs" and never claims
  Stripe's exact charge. If real Stripe fees materially exceed the assumption,
  raise `STRIPE_PAYMENT_FEE_PERCENT` / fixed amounts and bump
  `FEE_MODEL_VERSION` in `lib/payments/config.ts`.
- All amounts are integer minor units. Floating-point currency maths is
  forbidden everywhere in the payment domain.

## Environment variables

See `.env.example` for the full annotated list. Summary:

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client+server | RLS is the boundary |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | never in browser code |
| `STRIPE_SECRET_KEY` | server only | `sk_test_…` in preview, `sk_live_…` in production |
| `STRIPE_WEBHOOK_SECRET` | webhook route only | **different per endpoint; test ≠ live** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | client-safe | reserved; unused by hosted Checkout |
| `STRIPE_PLATFORM_FEE_BPS`, `STRIPE_PAYMENT_FEE_*`, `STRIPE_MINIMUM/MAXIMUM_GIFT_*` | server | fee model |
| `STRIPE_CONNECT_*_URL`, `STRIPE_CHECKOUT_*_URL` | server | optional, same-origin enforced |
| `RECONCILIATION_SECRET` | server | optional bearer token for scheduled reconciliation |

Missing Stripe/Supabase configuration fails safely: payment pages render an
honest unavailable state and APIs return 503 — marketing pages are unaffected.

## Database

Apply migrations to the linked project (`hjpfycbamwwpemsrrsqy`):

```bash
supabase db push
```

New tables (all RLS-enabled; financial writes are service-role only):
`stripe_connected_accounts`, `gifts`, `gift_events`, `gift_refunds`,
`gift_disputes`, `stripe_webhook_events`, `gift_notifications`, `admin_users`.

Grant yourself admin access (SQL editor or psql — the app never writes this
table):

```sql
insert into public.admin_users (user_id, note)
values ('<auth.users id>', 'Simon — founder');
```

## Supabase Auth (required once)

1. Dashboard → Authentication → URL Configuration: set Site URL to
   `https://buymeatee.com` and add redirect URLs for
   `https://buymeatee.com/auth/callback` (plus preview/localhost variants).
2. Authentication → Email: enable email sign-in (magic links). The default
   template works with the `/auth/callback` route (it handles both PKCE `code`
   and `token_hash` links).

## Stripe Dashboard checklist

Work top to bottom, first fully in **test mode**, later repeated for live.

### Platform setup (test mode)

1. Confirm **Connect is enabled**: Dashboard → Connect → Get started; choose
   "Platform or marketplace".
2. Complete the **platform profile** questionnaire (Connect → Settings →
   Platform profile): BuyMeATee collects payments for other people (golfers)
   using destination charges; the platform is responsible for refunds/disputes.
3. Confirm the **connected-account configuration**: accounts created by the
   code use the controller model (Stripe collects requirements, Express
   dashboard access, platform pays fees and owns losses). No dashboard toggle
   should contradict this.
4. **Platform branding** (Settings → Connect → Branding): BuyMeATee name, icon
   (`public/images/`… use brand assets), forest-green `#073e2e`.
5. **Onboarding branding**: same place — this is what recipients see during
   Stripe-hosted onboarding.
6. **Support contact details** (Settings → Business → Support): support email
   and site URL, shown on receipts and disputes.
7. **Statement descriptor** (Settings → Business → Bank statement descriptor):
   e.g. `BUYMEATEE` (+ dynamic suffix room). Make sure it does not imply
   BuyMeATee itself is the gift recipient.
8. **Payment methods** (Settings → Payments → Payment methods): cards only for
   the MVP. Do not enable other methods speculatively — the code also pins
   `payment_method_types: ["card"]`.
9. Create the **test webhook endpoint**: Developers → Webhooks → Add endpoint,
   URL `https://<preview-or-prod-host>/api/stripe/webhooks`.
10. Select exactly these events:
    - `checkout.session.completed`
    - `checkout.session.async_payment_succeeded`
    - `checkout.session.async_payment_failed`
    - `checkout.session.expired`
    - `payment_intent.processing`
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
    - `charge.refunded`
    - `charge.dispute.created`
    - `charge.dispute.updated`
    - `charge.dispute.closed`
    - `application_fee.refunded`
    - and under **Connect (events on connected accounts)**: `account.updated`,
      `capability.updated`, `payout.failed`
11. Copy the endpoint's **signing secret** into the hosting environment as
    `STRIPE_WEBHOOK_SECRET` (test secret with the test key).
12. Confirm **redirect/return URLs**: the app only ever passes
    `https://buymeatee.com/settings/payments/return`,
    `…/api/connect/refresh`, `…/gifts/{id}/thanks`, `…/gifts/{id}/cancelled`
    (or your same-origin overrides). No dashboard allow-list is needed for
    Account Links, but verify your Checkout settings don't restrict domains.

### Going live (repeat later, deliberately)

13. Complete the **platform's own business verification** (live mode
    activation for the BuyMeATee Stripe account).
14. Review **Connect platform responsibilities** (Connect → Settings): with
    destination charges + `losses.payments: application`, BuyMeATee is liable
    for refunds, disputes and negative balances.
15. Review **dispute and negative-balance settings** (and add a payout buffer
    if desired).
16. Review **connected-account payout behaviour** (default daily automatic;
    consider weekly to reduce dispute exposure).
17. Review **email receipt settings** (Settings → Emails): enable successful
    payment receipts from Stripe.
18. Create the **live webhook endpoint** separately (same URL, live mode, same
    event list) — it gets a **different signing secret**.
19. Replace the environment variables in production with live values:
    `STRIPE_SECRET_KEY=sk_live_…`, `STRIPE_WEBHOOK_SECRET=<live whsec>`.
    Test and live secrets must never mix; the code refuses events whose
    livemode doesn't match the configured key.
20. Run a **controlled low-value live transaction** (see script below) with a
    real card and a real onboarded recipient.
21. Confirm the recipient's connected account received exactly the gift amount
    (Connect → the account → Balance/Transfers).
22. Confirm BuyMeATee received the intended **application fee** (Reports →
    Connect → Collected fees).
23. Confirm Stripe's actual processing fee and check the net platform
    economics against the payment-handling assumption.
24. Test a **live refund** of that transaction from `/admin/payments`
    (reverses the transfer, refunds the application fee).
25. Read and file the **dispute operations process** below.

## Local webhook testing with the Stripe CLI

```bash
stripe login
# Forward events to the local dev server (prints a whsec_… secret):
stripe listen --forward-to localhost:3000/api/stripe/webhooks
# Put that printed secret in .env as STRIPE_WEBHOOK_SECRET (do NOT hard-code
# it anywhere in source), then in a second terminal:
stripe trigger checkout.session.completed
stripe trigger payment_intent.payment_failed
stripe trigger checkout.session.expired
stripe trigger charge.refunded
stripe trigger charge.dispute.created
stripe trigger account.updated
```

Note: `stripe trigger` events reference Stripe-generated objects, so most will
be recorded as `skipped — no matching gift`; they exercise signature checks,
the idempotency ledger and handler dispatch. For full end-to-end flows use the
manual script below with test cards.

## Manual end-to-end test script (test mode)

1. `npm run dev` with test-mode env vars + `stripe listen` running.
2. Sign in at `/sign-in` (magic link → `/auth/callback`).
3. Give your test profile a username in `profiles` if it has none.
4. `/settings/payments` → "Set up payments with Stripe" → complete hosted
   onboarding with test data (`000-000` SMS code, test IBAN/sort codes from
   Stripe docs).
5. Back on `/settings/payments`, verify the state becomes **Ready to receive
   Tees** (may briefly show verification pending).
6. Open `/t/<username>` in a private window (guest donor): pick £5, add a
   message and sender name, verify the breakdown (gift £5.00 / platform fee
   £0.25 / payment handling £0.29 / total £5.54, recipient receives £5.00).
7. Pay with `4242 4242 4242 4242` → success page should flip from
   "Confirming…" to paid within seconds (webhook).
8. Verify in Supabase: gift `paid`, Stripe ids populated, one row in
   `gift_notifications`, webhook events `processed`.
9. Declined card `4000 0000 0000 0002` → gift ends `payment_failed`.
10. 3-D Secure card `4000 0027 6000 3184` → complete the challenge → paid.
11. Abandon a checkout (close the tab) → after session expiry (or
    `stripe trigger`-free wait; default 24h — or use "Reconcile stuck gifts")
    the gift becomes `expired`; clicking back → `/gifts/{id}/cancelled`.
12. In the Stripe dashboard, resend a processed webhook event → the ledger
    shows `duplicate: true`; no second notification row appears.
13. `/dashboard/payments` as the recipient: the Tee is listed with the gross
    amount and message.
14. `/admin/payments` as an admin: find the gift, issue a full refund with a
    reason → after the webhook, status `refunded`, `gift_refunds` row present,
    transfer reversed in Stripe.
15. Trigger `charge.dispute.created` (card `4000 0000 0000 0259` creates a
    dispute) → gift `disputed`, row in `gift_disputes`, alert in logs.
16. Partial refund at API level: from Stripe dashboard refund a part of the
    payment → gift becomes `partially_refunded` with the right
    `amount_refunded`.
17. Onboard a second user but stop halfway → their `/t/<username>` page shows
    "isn't accepting Tees yet" and `/api/checkout` refuses with 409.

## Dispute operations process

1. Alert arrives via the `webhook.dispute_alert` structured log and the
   red panel in `/admin/payments` (gift status `disputed`).
2. Review the dispute in the Stripe dashboard (link in the admin table).
3. Gather evidence (gift record, message, recipient confirmation) and submit
   through Stripe's dispute UI before `evidence_due_by`.
4. Decide whether to reverse the recipient's transfer (Stripe dashboard →
   the transfer → reverse) — never automatic; requires a documented product
   and legal policy before penalising a recipient.
5. On `charge.dispute.closed` the gift becomes `dispute_won` or
   `dispute_lost`; reconcile the platform balance (a lost dispute debits the
   platform, including the dispute fee).
6. If the platform balance goes negative, top it up from the linked bank
   account and review payout buffers.

## Reconciliation

- Admin UI: `/admin/payments` → "Reconcile stuck gifts".
- Scheduled: `POST /api/admin/reconcile` with
  `Authorization: Bearer $RECONCILIATION_SECRET` (e.g. Vercel Cron, hourly).
- It re-reads Stripe for gifts stuck in `draft`/`checkout_created`/
  `processing`, repairs safe drift through the same verified path as webhooks
  (idempotent notifications), cancels stale drafts and flags mismatches for
  manual review. Nothing ever requires manually replaying webhooks.

## Known limitations / deliberate choices

- Cards only; no wallets/bank debits yet (`payment_method_types: ["card"]`).
- One connected account per user; country fixed at onboarding (GB default).
- Gift currency must equal the recipient account's settlement currency.
- The in-memory rate limiter is per serverless instance (best-effort); the
  security boundary is server-side validation, not the limiter.
- Notifications are queued in `gift_notifications` and shown in the dashboard;
  no email delivery until an email provider is chosen (queue drains later).
- Refund UI is full-refund only; the data model already supports partials.
