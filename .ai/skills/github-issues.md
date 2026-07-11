# Skill: GitHub Issues & Delivery Conventions

Repo: `simplesimondoes/buymeatee`. Use the `gh` CLI.

## Labels

- **Type:** `type:feature`, `type:bug`, `type:enhancement`, `type:research`, `type:content`, `type:architecture`
- **Area:** `area:marketing`, `area:seo`, `area:content`, `area:design-system`, `area:creator`, `area:supporter`, `area:payments`, `area:platform`, `area:legal`, `area:analytics`
- **Priority:** `priority:critical`, `priority:high`, `priority:medium`, `priority:low`
- **Status:** `status:needs-discovery`, `status:ready`, `status:blocked`, `status:in-review`
- **Source:** `source:founder`, `source:user-research`, `source:analytics`, `source:seo`, `source:support`

Every issue gets one type, at least one area, a priority and a status.

## Milestones

Marketing Wave 1 — Foundation · Marketing Wave 2 — Audiences · Marketing Wave 3 — SEO and content · Marketing Wave 4 — Early access · Marketing Wave 5 — Launch polish · Product Discovery.

Created/maintained by [scripts/setup-github-project.sh](../../scripts/setup-github-project.sh) (safe to rerun).

## Issue templates

Under `.github/ISSUE_TEMPLATE/`: `feature.md`, `bug.md`, `research.md`, `content-and-seo.md`, `architecture-decision.md`. Use them — they force scope, non-goals, acceptance criteria and verification to be stated.

## Seam mapping

Before building an issue (and when grooming one), add a **seam map** comment or section: likely files, existing components to reuse, new components needed, verification path. **Do not guess file paths before inspecting the implementation** — while the repo has no code, issues deliberately omit file paths; add seam maps once Wave 1 lands.

## Branch naming

`<type>/<issue-number>-<short-kebab-description>`, e.g. `feature/3-homepage-hero`, `bug/27-mobile-menu-focus`, `content/12-launch-articles`.

## PR conventions

Use the PR template. Reference completed issues with `Closes #N` so merges close them. PRs describe verification actually performed, not intended.

## Release pause

Building an issue does **not** include committing or pushing. Work pauses at the report step until the user says `Release` — see [.ai/workflows/release.md](../workflows/release.md).

## Reproducible issue creation

Backlog and milestone creation is scripted in `scripts/setup-github-project.sh` so the project setup can be recreated. New ad-hoc issues: `gh issue create` with template-matching bodies and full label sets.
