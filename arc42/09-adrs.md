# 9. Architecture Decision Records

Decisions recorded here were made in the founder briefs (July 2026) and govern the build. "Accepted" means decided; implementation status is noted where relevant. When a decision changes: set the old ADR to `Superseded by ADR-XXX`, add the new one, update affected chapters.

---

## ADR-001: Use Next.js App Router for the public website

### Status
Accepted (implemented July 2026)

### Context
The first deliverable is a marketing site where SEO, performance and maintainability by a small team matter most. The founder brief specifies Next.js App Router, TypeScript and Tailwind on Vercel.

### Decision
Build the public website with Next.js App Router and TypeScript, styled with Tailwind CSS, hosted on Vercel.

### Alternatives considered
Plain static-site generators (Astro, Eleventy) — strong for pure marketing but a worse evolution path toward the interactive application; SPA frameworks — poor SEO fit for server-rendered marketing content.

### Consequences
One framework carries the site from marketing phase into the future application. Server-component discipline is required to keep client JavaScript minimal.

---

## ADR-002: Server-render public content by default

### Status
Accepted (implemented July 2026)

### Context
SEO is a first-class requirement; important marketing copy must be crawlable and fast.

### Decision
All public pages are server rendered or statically generated. Client components are exceptions, used only for genuine interactivity and kept as small leaves.

### Alternatives considered
Client-side rendering with hydration-first UI — rejected for SEO and performance.

### Consequences
Content and metadata are produced server-side; interactive islands (menu, accordion, form) need deliberate design; hydration errors are treated as defects.

---

## ADR-003: Use local structured content or MDX before adding a CMS

### Status
Accepted (implemented July 2026)

### Context
The blog needs an SEO-ready architecture now, but content volume is small and the team is one founder.

### Decision
Blog articles live in the repository as MDX or typed structured content. No CMS.

*Implementation note (July 2026):* typed structured TypeScript content was chosen over MDX — articles are typed block arrays in `lib/content/articles/`, avoiding an MDX toolchain dependency while remaining easy to migrate to a CMS later.

### Alternatives considered
Headless CMS (Contentful, Sanity…) — operational and cost overhead unjustified at current volume; hosted blog platforms — splits SEO authority away from buymeatee.com.

### Consequences
Publishing requires a repo change (acceptable now). Content structures must be typed and clean enough to migrate to a CMS later if volume demands it — revisit via a new ADR.

---

## ADR-004: Isolate early-access submission behind a service boundary

### Status
Accepted (implemented July 2026)

### Context
Early-access interest capture is the site's key conversion, but no submission provider has been selected.

### Decision
Form submission goes through one isolated service module with a typed schema, server-side validation and a configurable endpoint (`EARLY_ACCESS_API_URL`). Providers are swappable; with no endpoint configured the UI shows an honest alternative rather than fake success.

### Alternatives considered
Direct provider SDK calls in components — couples UI to an unchosen provider; introducing a database for submissions — premature infrastructure ([ADR-005](#adr-005-do-not-introduce-database-authentication-or-payments-during-initial-validation)).

### Consequences
Provider selection is deferred without blocking the build; switching providers touches one module; the boundary is the natural place for validation and spam resistance.

---

## ADR-005: Do not introduce database, authentication or payments during initial validation

### Status
Accepted

### Context
The current phase validates demand. Databases, auth and payments each carry heavy security, compliance and operational costs, and payments additionally involve payouts, identity verification and minors.

### Decision
None of these are introduced during the marketing/validation phase. Introducing any of them requires the [architecture-change workflow](../.ai/workflows/architecture-change.md) and a new ADR, triggered by explicit product need.

### Alternatives considered
Building "app-ready" infrastructure up front — rejected as premature; the marketing site must not pay the application's costs before validation.

### Consequences
The site stays cheap, fast and low-risk. Copy must stay honest that payments do not exist yet. Some future rework is accepted as the price of not building on unvalidated assumptions.

---

## ADR-006: Use design tokens and reusable components as the shared UI foundation

### Status
Accepted (implemented July 2026)

### Context
The brand (premium editorial golf aesthetic) must stay consistent across many pages, maintained by AI sessions over time.

### Decision
All colour, typography, spacing and radius decisions live in central design tokens; pages are composed from a shared component library. No raw style values scattered through pages.

### Alternatives considered
Adopting a component framework (Material, shadcn as-is) — risks generic SaaS styling that weakens the brand; per-page ad-hoc styling — unmaintainable and drift-prone.

### Consequences
Slightly more upfront structure; in exchange, brand changes are single-point edits and future sessions can build on-brand pages from documented parts ([design-system skill](../.ai/skills/design-system.md)).

---

## ADR-007: Clearly label fictional product examples

### Status
Accepted

### Context
The pre-launch site needs to show what the product will feel like (creator cards, goals, progress) without fabricating traction — trust is the core asset of a money-handling platform.

### Decision
Every fictional creator, goal, amount or UI preview is visibly labelled `Example`, `Preview` or `Concept`. No fake reviews, ratings, user counts, partners or payment totals anywhere — including those present in the approved concept image, which are explicitly not reproduced.

### Alternatives considered
Unlabelled realistic demos — standard growth practice, rejected as dishonest and legally risky for a payments-adjacent product.

### Consequences
Marketing surfaces are slightly less "impressive" pre-launch; in exchange the brand is trustworthy from day one. Enforced via the [content checklist](../.ai/quality-gates/content-checklist.md).
