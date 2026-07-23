# Acceptable use & moderation policy — DRAFT

> **Status: LEGAL PLACEHOLDER — this is not final legal language.** Like
> `/terms`, `/privacy` and `docs/payments-legal-review.md`, this draft
> requires review by counsel before it is published or relied on. It exists
> so the moderation tooling (issue #28) operates against a written policy
> from day one rather than ad-hoc judgement.

## What creators may publish

Creator-entered public content on BuyMeATee — display names, usernames,
bios, photos and Goals — must be:

- **Honest.** Goals describe real golfing ambitions (green fees, travel,
  entries, coaching, equipment, production). No fabricated progress, no
  misleading claims about what support pays for. (Progress bars are
  webhook-verified by construction and cannot be edited by anyone.)
- **Yours.** Your own identity, your own images, no impersonation of other
  people, platforms or brands. Platform route names cannot be claimed as
  usernames (enforced in code).
- **Lawful and safe.** No hate, harassment, sexual content, violence,
  scams, regulated-goods fundraising, or anything that breaks the law in
  the creator's or supporters' jurisdictions.

## Minors

Junior golfers are represented by a parent or guardian, who owns the
account and its content. *(Legal review: age thresholds, consent evidence,
and whether images of minors need additional handling per jurisdiction.)*

## How moderation works (implemented)

1. **Review** — admins monitor recently created and changed public content
   (`/admin/moderation`).
2. **Item takedown** — an individual goal can be taken down (hidden from
   the public page, cannot be re-published until restored); a bio or photo
   can be removed. Removed text is preserved in the audit log, never
   silently destroyed.
3. **Page takedown** — a whole profile can be deactivated: the public page
   shows a neutral unavailable state and new Tees are refused server-side.
   Settled payments, refunds and payouts are untouched.
4. **Audit** — every action records who, what, when and why in an
   append-only log (`admin_actions`).
5. **Notification & appeal** — the creator is informed by email (manual
   for now, recorded as done in the audit reason) and may appeal by
   replying. *(Legal review: required notice periods, appeal rights, and
   statutory takedown regimes — e.g. DSA notice-and-action if EU users are
   in scope.)*
6. **Reinstatement** — a resolved issue is reversed through the same
   audited flow.

## Open items for counsel

- Terms & Conditions section granting BuyMeATee the right to remove
  content and suspend accounts, with the standard of review stated.
- Data-protection basis for retaining removed content in the audit log,
  and its retention period.
- Interaction with payment obligations: funds already settled to a
  deactivated creator's Stripe account are governed by Stripe's terms.
- Jurisdiction-specific illegal-content notice mechanisms.
