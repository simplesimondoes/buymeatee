# Payments deployment & rollback — BuyMeATee

## Safe production rollout plan

Payments ship dark: nothing on the marketing site links to the new routes, so
deploying the code changes nothing user-visible until recipients onboard.

1. **Database first**: `supabase db push` against `hjpfycbamwwpemsrrsqy`
   (adds tables + RLS; no changes to existing tables, zero risk to the live
   site).
2. **Test-mode env vars in Vercel** (Production): Supabase URL/anon/service
   keys, `STRIPE_SECRET_KEY=sk_test_…`, `STRIPE_WEBHOOK_SECRET` (test
   endpoint), fee vars. Leave live keys out.
3. Configure Supabase Auth URLs (see `docs/stripe-connect-setup.md`).
4. Deploy (`main` auto-deploys after release approval — see release rule).
5. Create the test webhook endpoint pointing at production, with the event
   list from the setup doc.
6. Run the full manual end-to-end test script **in test mode against
   production** (test keys on the live domain are safe: no real money moves).
7. Insert the founder into `admin_users`; verify `/admin/payments`.
8. Complete the live-mode dashboard checklist (items 13–19).
9. Swap `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to live values,
   redeploy, run the controlled £2 live transaction (items 20–24).
10. Only then invite real recipients to onboard.

Any test-mode rows created against production are marked `livemode=false` and
stay distinguishable forever.

## Rollback plan

The payment system is additive and isolated:

- **Application rollback**: revert to the previous Vercel deployment (or
  `git revert` the payments commit and push). Marketing pages are untouched
  either way. In-flight Checkout Sessions simply expire (24h) — Stripe takes
  no money without a completed session, and the reconciliation endpoint can
  mark the leftovers `expired` once the code returns.
- **Disable without rollback**: remove `STRIPE_SECRET_KEY` (payment routes
  return honest 503s / unavailable states) or pause the webhook endpoint in
  the Stripe dashboard (Stripe retries deliveries for days, so nothing is
  lost while paused).
- **Database**: do NOT drop the payment tables if any live gift exists —
  financial records must be retained. The schema is additive, so old code
  runs against it unchanged.
- **Paid-but-unrecorded gap** (webhook outage during rollback): once
  redeployed, run `/api/admin/reconcile` — it repairs paid/expired drift from
  Stripe's records without duplicate notifications.

## Monitoring

Structured JSON logs (`source: "payments"`) in Vercel logs. Watch for:
`webhook.reconciliation_error`, `webhook.dispute_alert`,
`webhook.payout_failed_alert`, `webhook.processing_failed`,
`refund.failed`, `connect.sync_unknown_account`. Also check
`/admin/payments` for the reconciliation-errors panel and Stripe's own
webhook-delivery dashboard for failure rates.
