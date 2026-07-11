# Workflow: Architecture Change

Use **before** major technical changes: authentication, database, payments, creator payouts, media storage, moderation, native apps, public creator discovery, major analytics decisions.

Wear the [architect role](../agents/architect.md).

1. **Define the problem.** What forces a decision now? What validation evidence supports it?
2. **Describe current constraints** (see [arc42/02-constraints.md](../../arc42/02-constraints.md)).
3. **List realistic options** — including "do nothing yet".
4. **Compare trade-offs**: cost, complexity, lock-in, security/privacy, operational burden, fit with the validation phase.
5. **Recommend one option**, with reasoning.
6. **Record the decision as an ADR** in [arc42/09-adrs.md](../../arc42/09-adrs.md) (status, context, decision, alternatives, consequences).
7. **Update affected arc42 chapters** (and skills / `CLAUDE.md` where relevant).
8. **Only then implement the approved change.**

Steps 1–7 can complete as a proposal that pauses for the founder's decision. Do not implement while the decision is open.
