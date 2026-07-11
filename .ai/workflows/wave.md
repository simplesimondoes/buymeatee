# Workflow: Wave (default)

The default process for any feature or wave of work.

## 1. Read

- Read `CLAUDE.md`.
- Read the relevant GitHub issues (milestone = wave).
- Read the relevant `.ai/skills/` and `arc42/` chapters.

## 2. Scope

- Confirm the wave's single theme.
- Identify explicit exclusions.
- Defer unrelated improvements — note them as candidate issues instead.

## 3. Inspect

- Find existing implementation seams.
- Identify reuse versus new construction.
- Note likely files.
- Identify risks **before** coding.

## 4. Build

- Implement the smallest coherent solution.
- Reuse existing components and utilities.
- Update tests and documentation where appropriate.

## 5. Review

- Wear the [reviewer role](../agents/reviewer.md).
- Run matching specialist reviews: [security](../agents/security.md), [SEO](../agents/seo-editor.md), [content](../agents/content-designer.md) as relevant.

## 6. Verify

- Run the implementation.
- Exercise the relevant journey end to end.
- Check responsive states: 375 / 768 / 1024 / 1440px.
- Capture screenshots for visual work where practical (into `.ai/artifacts/current/`).

## 7. Gates

- Run lint.
- Run tests.
- Run the production build.
- Complete the matching checklists in [.ai/quality-gates/](../quality-gates/).

(While no package.json exists, state that honestly instead of claiming gates passed.)

## 8. Report

- Explain what changed.
- Explain what was verified (actually verified, not intended).
- List unresolved risks or follow-up work.

## 9. Pause

- **Do not commit or deploy.**
- Wait for the explicit instruction: `Release` → then follow [release.md](release.md).
