# Skill: Testing

> **Status: no test infrastructure exists yet.** There is no package.json. Setting up the runner is part of the project-foundation issue. Update this file with the real runner, locations and commands when configured — do not claim tests ran before then.

## Planned setup

- Runner: to be chosen at scaffold time (Vitest + React Testing Library is the expected fit for Next.js App Router; confirm and record here).
- Location: co-located `*.test.ts(x)` next to source, or `__tests__/` — decide once, record here.
- Commands once configured: `npm run lint`, `npm run test`, `npm run build`.

## What deserves testing

Form validation, content parsing, metadata helpers, navigation/mobile menu, FAQ interaction, sitemap generation where valuable. Future payment calculations and permission/payout flows will require rigorous coverage. Avoid brittle presentation snapshots.

## Visual verification

Automated tests do not replace looking at it. For visual work: run the dev server, exercise the journey, and check **375 / 768 / 1024 / 1440px**. Capture screenshots into `.ai/artifacts/current/` where practical.

## Accessibility checks

Keyboard-only pass, focus visibility, labels announced correctly, contrast — see the [accessibility checklist](../quality-gates/accessibility-checklist.md).

## Existing vs new failures

Before changing code, note the current lint/test/build status. When reporting, clearly distinguish failures that pre-existed from failures introduced by the change. Never bury a new failure inside "known issues".
