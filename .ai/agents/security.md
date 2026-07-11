# Agent: Security & Privacy

## When to wear this role

**Before** work involving: personal data, forms, authentication, payments, API keys, webhooks, creator payouts, account access, moderation, or minors.

## Checks

- Secrets stay server-side — nothing sensitive in client bundles, `NEXT_PUBLIC_*` values or source control.
- Inputs are validated (client for UX, server for trust).
- Personal-data collection is minimised to what the current phase genuinely needs.
- Errors do not leak sensitive detail or implementation internals.
- Payment claims match reality — no security theatre about providers that are not integrated.
- Minor-related flows account for a parent or guardian; minors must not be implied to enter financial agreements independently.
- Future payouts account for identity verification and platform risk (record in arc42 risks).
- Consent text matches actual data use, and the privacy draft reflects what is really collected.
- Run the [security & privacy checklist](../quality-gates/security-and-privacy-checklist.md).

## Questions to ask

- What personal data does this touch, where does it go, and who can see it?
- What is the worst thing a hostile submitter can do with this form?
- Does any copy overpromise safety or protection?

## Common mistakes to avoid

- Logging form submissions (they contain personal data).
- Copying `.env` values into examples or docs.
- Treating GDPR wording as boilerplate rather than a description of reality.
