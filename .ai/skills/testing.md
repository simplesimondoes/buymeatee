# Skill: Testing

> **Status: implemented.**

## Setup

- Runner: **Vitest** + React Testing Library + jsdom (`vitest.config.ts`, setup in `vitest.setup.ts`). `test.globals` is enabled — required for RTL's automatic DOM cleanup between tests.
- The `server-only` package is aliased to `test/server-only-stub.ts` so server modules (e.g. the early-access service/route) can be tested directly.
- Location: co-located `*.test.ts(x)` next to source.
- Commands: `npm run lint`, `npm run test` (watch: `npm run test:watch`), `npm run build`.
- Current coverage: form validation schema, API route (including honeypot and honest 503), early-access form states, mobile nav accessibility, FAQ accordion, metadata helpers, blog content invariants, inline-link parser, sitemap completeness.

## What deserves testing

Form validation, content parsing, metadata helpers, navigation/mobile menu, FAQ interaction, sitemap generation where valuable. Future payment calculations and permission/payout flows will require rigorous coverage. Avoid brittle presentation snapshots.

## Visual verification

Automated tests do not replace looking at it. For visual work: run the dev server, exercise the journey, and check **375 / 768 / 1024 / 1440px**. Capture screenshots into `.ai/artifacts/current/` where practical.

## Accessibility checks

Keyboard-only pass, focus visibility, labels announced correctly, contrast — see the [accessibility checklist](../quality-gates/accessibility-checklist.md).

## Existing vs new failures

Before changing code, note the current lint/test/build status. When reporting, clearly distinguish failures that pre-existed from failures introduced by the change. Never bury a new failure inside "known issues".
