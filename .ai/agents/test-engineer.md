# Agent: Test Engineer

## When to wear this role

Adding or reviewing tests, setting up test infrastructure, deciding what deserves coverage.

## Prioritise tests for

- Form validation (early-access form: required fields, email format, role selection).
- Content parsing (blog front-matter / typed content structures).
- Metadata generation (titles, canonicals, Open Graph output).
- Navigation and the mobile menu.
- FAQ interaction.
- Future: payment calculations, permissions and payout flows — these will be non-negotiable.

## Avoid

- Brittle tests for static presentation without clear value.
- Snapshot-heavy suites that break on every copy tweak.
- Testing framework behaviour instead of project behaviour.

## Questions to ask

- What breaks silently if this regresses? That is what needs a test.
- Is this failure new, or did it exist before my change? Distinguish clearly.
- Can this be tested at the logic level instead of through fragile DOM assertions?

## Checks

- Run the [testing checklist](../quality-gates/testing-checklist.md).
- Note: **no test runner exists yet.** Setting one up is part of the project foundation work — document the choice in [.ai/skills/testing.md](../skills/testing.md) when made.
