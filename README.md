# BuyMeATee

**Support the journey.** BuyMeATee (`buymeatee.com`) is a golf-focused creator-support platform: golf fans help creators, aspiring professionals, amateur competitors, coaches and course reviewers chase meaningful goals.

**Current status: pre-launch marketing website implemented.** The public marketing site (homepage, audience pages, blog, early-access form, legal drafts) lives in this repository and is ready for review. Payments, accounts and dashboards do **not** exist yet — see [.ai/context/current-phase.md](.ai/context/current-phase.md).

## Setup

```bash
npm install
```

Requires Node 20+ (developed on Node 22).

## Development

```bash
npm run dev        # dev server at http://localhost:3000
```

Stack: Next.js (App Router, server components by default), TypeScript (strict), Tailwind CSS 4 (design tokens in `app/globals.css`), Lucide icons, Vitest + React Testing Library.

| Where | What |
| --- | --- |
| `app/` | Routes (one folder per route), sitemap, robots, manifest, OG image, icons |
| `components/` | Reusable UI (header, footer, cards, form, accordion…) — `components/home/` holds homepage sections |
| `lib/site.ts` | Brand config, navigation, footer links |
| `lib/seo/` | Metadata + structured-data builders |
| `lib/content/` | Typed content: images, goals, FAQs, support options, blog articles |
| `lib/early-access/` | Form schema + isolated submission service |
| `public/images/` | Imagery (currently low-res placeholders — see [.ai/context/image-requirements.md](.ai/context/image-requirements.md)) |

## Environment variables

Copy `.env.example` to `.env.local`:

- `NEXT_PUBLIC_SITE_URL` — canonical origin (defaults to `https://buymeatee.com`).
- `EARLY_ACCESS_API_URL` — server-side endpoint that receives early-access form submissions as a JSON POST. Leave empty and the form reports honestly that sign-up isn't connected (it never fakes success). To connect a provider (Formspree, Loops, ConvertKit, a Supabase function…), point this at its endpoint — the integration is isolated in `lib/early-access/service.ts`, so swapping providers touches one file. Never commit secrets.

## Testing

```bash
npm run lint       # ESLint
npm run test       # Vitest (unit + component tests)
npm run build      # production build (also type-checks)
```

Visual work is additionally checked at 375 / 768 / 1024 / 1440 px (see [.ai/workflows/wave.md](.ai/workflows/wave.md)).

## Build & deployment

`npm run build` produces a fully static site (only `/api/early-access` is server-rendered). Deployment target: Vercel with the GitHub integration, production domain `buymeatee.com`. Set the environment variables above in Vercel project settings.

## Content editing

- **Marketing copy** lives in the page/section components; shared honest-content rules in [.ai/skills/content.md](.ai/skills/content.md).
- **Blog articles** are typed structured content in `lib/content/articles/` — add a file, register it in `lib/content/blog.ts`, and the listing, sitemap and structured data update automatically.
- **FAQs, goals, support options, navigation** are typed data in `lib/content/` and `lib/site.ts`.
- **Images** are centralised in `lib/content/images.ts`; requirements and replacement guidance in [.ai/context/image-requirements.md](.ai/context/image-requirements.md).

## Workflow usage

Project knowledge lives in the repository, not chat history. Start every AI session with **[CLAUDE.md](CLAUDE.md)**; the default process is [.ai/workflows/wave.md](.ai/workflows/wave.md) (read → scope → inspect → build → review → verify → gates → report → **pause**).

| Where | What |
| --- | --- |
| [.ai/workflows/](.ai/workflows/) | Processes — wave is the default |
| [.ai/agents/](.ai/agents/) | Roles to wear per kind of work |
| [.ai/skills/](.ai/skills/) | How this project works: stack, design system, SEO, content, forms, testing… |
| [.ai/quality-gates/](.ai/quality-gates/) | Checklists that gate completion |
| [.ai/context/](.ai/context/) | Product, phase, brand, links, image requirements |
| [arc42/](arc42/) | Architecture documentation; decisions in [09-adrs.md](arc42/09-adrs.md) |

### Release control

**Nothing is committed, merged, pushed or deployed until the user explicitly says `Release`.** Work pauses at the report step. See [.ai/workflows/release.md](.ai/workflows/release.md).

## GitHub project setup

Labels, milestones and the initial backlog are created reproducibly by:

```bash
./scripts/setup-github-project.sh
```

Requires an authenticated GitHub CLI (`gh auth login`) with `repo` scope. Safe to rerun. Conventions: [.ai/skills/github-issues.md](.ai/skills/github-issues.md).

## Design references

- `screenshots/image.png` — approved marketing-page concept
- `screenshots/appui.png` — mobile-app UI concepts
- `files/` — original founder briefs (including the contact sheet the current placeholder images were extracted from)
