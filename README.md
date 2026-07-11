# BuyMeATee

**Support the journey.** BuyMeATee (`buymeatee.com`) is a golf-focused creator-support platform: golf fans help creators, aspiring professionals, amateur competitors, coaches and course reviewers chase meaningful goals.

**Current status: pre-code.** This repository currently contains the product's long-term memory — workflow, context, architecture documentation and design references. The marketing website is built through the Marketing Wave milestones (see [Issues](https://github.com/simplesimondoes/buymeatee/issues)).

## Start here

1. **[CLAUDE.md](CLAUDE.md)** — the entry point for every AI development session: product, phase, rules, vocabulary, map.
2. **[arc42/developer-context.md](arc42/developer-context.md)** — compact orientation.
3. The relevant issue(s) for the work at hand.

## The workflow

Development follows a repository-based AI workflow: project knowledge lives here, not in chat history, so sessions can start with short prompts like *"Start Marketing Wave 1. Read the linked issues and repository context. Build, verify and pause for release."*

| Where | What |
| --- | --- |
| [.ai/workflows/](.ai/workflows/) | Processes — [wave.md](.ai/workflows/wave.md) is the default (read → scope → inspect → build → review → verify → gates → report → **pause**) |
| [.ai/agents/](.ai/agents/) | Roles to wear: product manager, frontend dev, SEO editor, content designer, designer, architect, backend dev, security, test engineer, reviewer, documentation |
| [.ai/skills/](.ai/skills/) | How this project works: stack, design system, SEO, content, forms, testing, operations, architecture, GitHub conventions |
| [.ai/quality-gates/](.ai/quality-gates/) | Checklists that gate completion (review, SEO, accessibility, security & privacy, content, testing, release) |
| [.ai/context/](.ai/context/) | Product, phase, brand and links |
| [arc42/](arc42/) | Architecture documentation; decisions in [09-adrs.md](arc42/09-adrs.md) |

### Release control

**Nothing is committed, merged, pushed or deployed until the user explicitly says `Release`.** Work pauses at the report step. See [.ai/workflows/release.md](.ai/workflows/release.md).

## Setup / development / testing / build

Not applicable yet — no application code exists. Once the project is scaffolded (Wave 1 issue: *Establish project foundation and design tokens*) this section will document:

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

Environment variables will be documented in `.env.example` (agreed so far: `NEXT_PUBLIC_SITE_URL`, `EARLY_ACCESS_API_URL`). Deployment: Vercel → `buymeatee.com` (see [.ai/skills/operations.md](.ai/skills/operations.md)).

## Content editing

Blog and marketing content conventions live in [.ai/skills/content.md](.ai/skills/content.md). Content architecture is created in Marketing Wave 3.

## GitHub project setup

Labels, milestones and the initial backlog are created reproducibly by:

```bash
./scripts/setup-github-project.sh
```

Requires an authenticated GitHub CLI (`gh auth login`) with `repo` scope. Safe to rerun — existing labels are updated, existing milestones and issues (by title) are skipped. Conventions: [.ai/skills/github-issues.md](.ai/skills/github-issues.md).

## Design references

- `screenshots/image.png` — approved marketing-page concept
- `screenshots/appui.png` — mobile-app UI concepts
- `files/` — original founder briefs
