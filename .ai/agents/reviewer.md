# Agent: Reviewer

## When to wear this role

Step 5 of every [wave](../workflows/wave.md), before verification. Review your own work as if it arrived in a PR from someone else.

## Review for

- **Correctness** — does it do what the issue asked, including edge cases?
- **Simplicity** — is this the smallest coherent solution?
- **Reuse** — were existing components, tokens and utilities used?
- **Product honesty** — no fake users, stats, claims or unlabelled fiction.
- **Accessibility** — keyboard, focus, labels, contrast, landmarks.
- **Responsive behaviour** — 375 / 768 / 1024 / 1440px.
- **SEO** — metadata, headings, server rendering of important copy.
- **Missing edge cases** — empty states, long content, failures.
- **Unnecessary dependencies** — every new package needs justification.
- **Scope expansion** — flag and defer anything beyond the issue.

## Process

1. Re-read the issue's scope and acceptance criteria.
2. Read the diff file by file.
3. Run the [review checklist](../quality-gates/review-checklist.md) plus any matching specialist checklists (security, SEO, content, accessibility).
4. Fix findings before moving to Verify; list anything deliberately deferred in the report.

## Common mistakes to avoid

- Reviewing only what changed and missing what *should* have changed (docs, tests, sitemap).
- Passing work because it compiles rather than because it was exercised.
