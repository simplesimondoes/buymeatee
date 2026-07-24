# Email setup (Resend) — operations

BuyMeATee sends transactional email through [Resend](https://resend.com) behind
the `lib/email/` boundary (ADR-013). This is the checklist to make email live.
Until it is done, every send fails safely: the app reports "not-configured" and
never fakes a delivery.

## What sends, and how

| Email | Trigger | Path | Delivery |
| --- | --- | --- | --- |
| **Gift received** → Creator | A tee is paid (verified webhook) | `gift_notifications` queue | Drained by cron |
| **Goal reached** → Creator | A gift crosses a goal's target | `gift_notifications` queue | Drained by cron |
| **Gift receipt** → Supporter | A tee is paid | Direct from webhook | Immediate, best-effort |
| **Early-access welcome** | Signup captured | Direct from signup route | Immediate, best-effort |

**Sign-in magic links are NOT sent by this app** — Supabase Auth sends them
(ADR-010). To route them through Resend, configure Supabase SMTP (below). There
is **no password-reset email**: authentication is passwordless.

## 1. Resend dashboard

1. Create/verify the sending **domain** (`buymeatee.com`) — add the DKIM/SPF
   DNS records Resend shows and wait for verification.
2. Create an **API key** (starts `re_...`).
3. Decide the sender address, e.g. `notifications@buymeatee.com`. It must be on
   the verified domain.

## 2. Environment variables

Set these in Vercel (Production + Preview) and, for local dev, `.env.local`:

```
RESEND_API_KEY=re_...                              # server-only, never commit
EMAIL_FROM=BuyMeATee <notifications@buymeatee.com> # sender on the verified domain
EMAIL_REPLY_TO=                                    # optional; defaults to EMAIL_FROM
NOTIFICATIONS_DELIVERY_SECRET=                     # long random token for the cron endpoint
```

> **Key hygiene:** the key is a secret. If it is ever shared in plain text
> (chat, screenshot, commit), rotate it in the Resend dashboard.

## 3. Draining the notification queue

Queued Creator emails (gift received, goal reached) are sent by
`POST /api/notifications/deliver`, which drains rows still marked `pending`.
Call it either as a signed-in admin, or with the bearer token:

```
curl -X POST https://buymeatee.com/api/notifications/deliver \
  -H "Authorization: Bearer $NOTIFICATIONS_DELIVERY_SECRET"
```

Schedule it with **Vercel Cron** (e.g. every 5 minutes). The run is idempotent —
it only picks up rows still `pending`; transient failures stay `pending` for the
next run, terminal ones (no recipient email, unknown type) are marked `failed`.

Example `vercel.json` entry:

```json
{ "crons": [{ "path": "/api/notifications/deliver", "schedule": "*/5 * * * *" }] }
```

(Vercel Cron authenticates via the platform; the bearer token is for manual or
external schedulers.)

## 4. (Optional) Route Supabase Auth emails through Resend

Magic-link sign-in emails come from Supabase, not this app. To send them via
Resend, in the Supabase dashboard: **Authentication → Emails → SMTP Settings**,
enable custom SMTP and use Resend's SMTP credentials:

- Host: `smtp.resend.com`, Port: `465` (SSL) or `587` (STARTTLS)
- Username: `resend`
- Password: your `RESEND_API_KEY`
- Sender: the same verified `EMAIL_FROM` address

Customise the magic-link template under the same Auth → Emails screen. No app
code change is involved.

## Verifying

- Local: with the env vars set, submit the early-access form — you should get a
  welcome email; check `email.sent` in the server logs.
- Queue: after a test payment, run the deliver endpoint and confirm the row
  flips to `sent` in `gift_notifications`.
- Unconfigured: with the vars blank, everything logs `email.not_configured` and
  no send is attempted — the app still works.
