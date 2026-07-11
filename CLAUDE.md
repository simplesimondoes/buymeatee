# CLAUDE.md — BuyMeATee

Primary entry point for AI development sessions. Read this first, then follow the pointers.

## Product

BuyMeATee is a golf-focused creator-support platform. It helps golf fans support creators, aspiring professionals, amateur competitors, coaches, course reviewers and other golfers as they pursue meaningful goals.

The core proposition is:

> Support the journey.

The product must feel like participation in a golfer's journey, not a generic donation platform. Full product context: [.ai/context/product.md](.ai/context/product.md).

## Current phase

> Marketing website and product validation.

**No code has been written yet.** The repository currently contains the workflow, architecture documentation and design references. The marketing website is built in Marketing Wave 1 onwards (see the GitHub milestones and backlog).

Do not build the full application, payments, creator dashboard, supporter dashboard or authentication unless a future issue explicitly introduces them. See [.ai/context/current-phase.md](.ai/context/current-phase.md).

## Release-control rule

**Do not commit, merge, push or deploy completed work unless the user explicitly says: `Release`.**

The default workflow is: Scope → Inspect → Build → Review → Verify → Report → **Pause** → wait for the explicit release instruction.

If the user explicitly instructs a commit, push or deploy as part of a particular task, that instruction overrides the pause rule for that task only. Full process: [.ai/workflows/release.md](.ai/workflows/release.md).

## Current technology

**Planned stack — not yet implemented.** When the marketing site is built it will use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Vercel (production domain: `https://buymeatee.com`)
- Server-rendered or statically generated public pages
- Local structured content or MDX for the blog
- No production database (not until explicitly introduced via ADR)
- No payment provider selected yet
- No authentication provider selected yet

**Update this section as soon as the implementation exists or changes.** Stack conventions: [.ai/skills/nextjs-typescript.md](.ai/skills/nextjs-typescript.md).

## Product vocabulary

Use consistently: **BuyMeATee, Creator, Supporter, Goal, Journey, Buy a tee, Support a round, Green fee, Early access**.

Avoid: donation, recipient, begging, crowdfunding campaign, influencer-only wording.

Full glossary: [arc42/12-glossary.md](arc42/12-glossary.md). Brand voice: [.ai/context/brand.md](.ai/context/brand.md).

## Hard rules

- Use the exact spelling `BuyMeATee`.
- Do not invent users, reviews, supporter counts, partners or payment totals.
- Fictional examples must be labelled `Example`, `Preview` or `Concept`.
- Do not claim payment functionality exists before it is built.
- Do not introduce a database or complex service without an explicit product need.
- Never expose secrets in browser code or source control.
- Important public marketing content must be server rendered or statically generated.
- SEO metadata must be unique and accurate.
- Accessibility and responsive behaviour are part of done.
- Legal placeholders must remain marked for legal review.
- Reuse existing components and patterns before creating duplicates.
- Record meaningful architectural decisions in [arc42/09-adrs.md](arc42/09-adrs.md).
- Pause before release unless explicitly instructed otherwise.

## Verification commands

**None exist yet — there is no package.json.** Do not claim to have run lint, tests or a build until the project scaffold exists.

Once the Next.js project is created (Marketing Wave 1), the expected commands are:

```bash
npm install
npm run lint
npm run test
npm run build
```

Update this section (and [.ai/skills/testing.md](.ai/skills/testing.md)) with the real commands when they exist.

Visual changes must also be verified at **375px, 768px, 1024px and 1440px**.

## Repository map

| Path | Purpose |
| --- | --- |
| `.ai/agents/` | Role definitions to "wear" for specific kinds of work |
| `.ai/skills/` | How this project actually works (stack, SEO, content, forms…) |
| `.ai/workflows/` | Repeatable processes; [wave.md](.ai/workflows/wave.md) is the default |
| `.ai/quality-gates/` | Checklists that gate completion |
| `.ai/context/` | Product, phase, brand and link knowledge |
| `.ai/artifacts/` | Temporary working documents (current/ and archive/) |
| `arc42/` | Architecture documentation and ADRs |
| `.github/` | Issue and PR templates |
| `scripts/` | GitHub project setup automation |
| `files/` | Original founder briefs (marketing site + workflow prompts) |
| `screenshots/` | Approved design concepts (marketing page + app UI) |

Not yet created (will exist after Wave 1+): blog content, shared marketing components, form integration, SEO utilities. When they exist, record their locations here and in the relevant skills.

## Keep documentation alive

Whenever a task reveals a reusable lesson, put it in the right home: `CLAUDE.md` (critical universal rule), `.ai/skills/` (stack knowledge), `.ai/workflows/` (process), `.ai/quality-gates/` (repeatable checks), `arc42/` (architecture/decisions), `.ai/context/` (product and brand). Do not leave important knowledge only in chat. Stale documentation is a defect.
