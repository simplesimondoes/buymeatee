# Skill: Architecture

The architecture documentation lives in [arc42/](../../arc42/). This skill is the map into it.

## Current system shape

The marketing site is **implemented** (July 2026) exactly along the decided shape (see [arc42/04-solution-strategy.md](../../arc42/04-solution-strategy.md)): a statically generated Next.js site with typed local content (`lib/content/`), a token-based design system (`app/globals.css` + `components/`), and an isolated early-access form service boundary (`lib/early-access/`). No database, no auth, no payments.

## Where to look

- Goals and audiences: [arc42/01-introduction-and-goals.md](../../arc42/01-introduction-and-goals.md)
- Constraints (read before proposing anything): [arc42/02-constraints.md](../../arc42/02-constraints.md)
- External context and actors: [arc42/03-context-and-scope.md](../../arc42/03-context-and-scope.md)
- Building blocks: [arc42/05-building-blocks.md](../../arc42/05-building-blocks.md)
- Runtime flows: [arc42/06-runtime-view.md](../../arc42/06-runtime-view.md)
- Deployment: [arc42/07-deployment-view.md](../../arc42/07-deployment-view.md)
- Cross-cutting rules: [arc42/08-cross-cutting-concepts.md](../../arc42/08-cross-cutting-concepts.md)
- **Decisions: [arc42/09-adrs.md](../../arc42/09-adrs.md)**
- Quality targets: [arc42/10-quality-requirements.md](../../arc42/10-quality-requirements.md)
- Risks: [arc42/11-risks-and-technical-debt.md](../../arc42/11-risks-and-technical-debt.md)
- Compact orientation: [arc42/developer-context.md](../../arc42/developer-context.md)

## Where future application decisions belong

Authentication, database, payments, payouts, media storage, moderation, native apps, creator discovery, major analytics: all go through the [architecture-change workflow](../workflows/architecture-change.md) and produce an ADR **before** implementation. Wear the [architect role](../agents/architect.md).

## ADR requirement

Any decision that is expensive to reverse, affects data/security/money, or shapes the codebase long-term gets an ADR in `09-adrs.md`. When a decision changes: update the old ADR's status, add the replacement, update affected chapters.
