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

---

## ADR-008: Introduce Supabase for the application database

### Status
Accepted (July 2026) — partially supersedes ADR-005 (database only; auth flows and payments remain out of scope)

### Context
The marketing site is live and product validation has begun. The founder explicitly introduced a Supabase project (`hjpfycbamwwpemsrrsqy`, "Buy Me a Tee", EU Frankfurt) to hold user profiles and early-access sign-up emails — the first persistent data the product needs.

### Decision
Use Supabase (Postgres + built-in auth schema) as the application database, managed through CLI migrations in `supabase/migrations/` (linked via `supabase link`). Foundation schema: `public.profiles` (one row per `auth.users` entry, auto-created by a `handle_new_user` trigger, public-read / self-write RLS) and `public.early_access_signups` (form-shaped columns mirroring `lib/early-access/schema.ts`, RLS enabled with no policies so only the server-side service role can access it). Schema changes go through new migration files and `supabase db push` — never through the dashboard editor.

### Alternatives considered
Continuing with a third-party form endpoint only (no database) — kept as the submission mechanism option but insufficient for owning sign-up data; a self-hosted Postgres — more operational burden with no benefit at this stage.

### Consequences
The product now has persistent state and a data-protection surface (emails are personal data — no logging of payloads, service-role key stays server-side, never in browser code or source control). Sign-up (`auth.users`) automatically produces a profile row. The marketing site itself remains static and does not yet connect to Supabase; wiring the early-access form to it is a separate task behind the existing ADR-004 service boundary.

---

## ADR-009: Stripe Connect destination charges for gift payments

### Status
Accepted (July 2026) — partially supersedes ADR-005 (payments are now in scope by explicit founder instruction)

### Context
BuyMeATee must let a supporter send a monetary gift ("Tee") to a golfer. The platform must never hold recipient money itself, must retain a platform fee, and must track every payment reliably. BuyMeATee has its own Stripe platform account and its own Supabase project (no sharing with any other product).

### Decision
Use Stripe Connect with **destination charges** and Stripe-hosted surfaces end to end:

- **Connected accounts** are created server-side with the controller model (`fees.payer: application`, `losses.payments: application`, `stripe_dashboard: express`, `requirement_collection: stripe`) and only the `transfers` capability. Stripe owns KYC, bank collection and payouts via hosted onboarding (Account Links); we never build identity forms.
- **Payments** use Stripe-hosted Checkout (`mode: payment`, cards only initially) with `transfer_data.destination` set to the recipient's account and `application_fee_amount` = platform fee + payment handling, so the recipient's transfer always equals the chosen gift amount.
- **Fees** come from one server-side module (`lib/payments/config.ts` + pure `lib/payments/fees.ts`), integer minor units only, versioned via `fee_model_version` stored on every gift. Payment handling is a grossed-up documented commercial assumption, not a claim of Stripe's exact charge.
- **State** lives in Supabase (`stripe_connected_accounts`, `gifts`, `gift_events`, `gift_refunds`, `gift_disputes`, `stripe_webhook_events`, `gift_notifications`, `admin_users`), all RLS-enabled; financial writes happen only via the service role in server code. Gifts are marked paid **only** by the signature-verified webhook after amount/currency/destination/application-fee verification; mismatches become reconciliation errors surfaced in `/admin/payments`.
- **Refunds** (admin-only MVP) use `reverse_transfer` + `refund_application_fee`; disputes are tracked from day one because destination charges make the platform liable.

### Alternatives considered
Separate charges and transfers — more flexibility, more reconciliation burden, unnecessary for 1:1 gifts. Payment Links — rejected: each payment binds dynamically to recipient, gift record and message. Platform-collects-then-pays-out (manual payouts/wallet) — rejected outright: implies holding customer money and a regulatory surface we must avoid.

### Consequences
The platform pays Stripe processing fees out of its application fee (covered by the donor-facing "payment handling" line) and carries dispute liability. Test and live modes are separated by keys, webhook secrets and a `livemode` column on financial rows. Operational docs live in `docs/stripe-connect-setup.md`; deployment and rollback in `docs/payments-deployment.md`; legal-review items in `docs/payments-legal-review.md`.

---

## ADR-010: Minimal passwordless Supabase Auth for payment features

### Status
Accepted (July 2026) — partially supersedes ADR-005 (auth flows only as far as payments require)

### Context
Stripe Connect onboarding, payment settings and the recipient dashboard need an authenticated user, but the product is otherwise still in validation and no full account system is wanted.

### Decision
Introduce the smallest workable Supabase Auth surface: email magic links only (`signInWithOtp`), an `/auth/callback` route handling both PKCE and token-hash flows, cookie sessions via `@supabase/ssr`, and a middleware whose matcher covers only the authenticated areas (`/settings`, `/dashboard`, `/admin`, `/sign-in`, `/auth`, payment APIs) so every marketing page stays fully static. No passwords, no social providers, no profile management UI. Post-auth redirects accept same-site relative paths only.

### Alternatives considered
Full auth provider integration (passwords, OAuth) — premature; deferring auth entirely — impossible, Connect onboarding must bind a Stripe account to a verified user.

### Consequences
The marketing header is unchanged (sign-in is reachable at `/sign-in`, linked from payment flows). Magic-link email templates and redirect URLs must be configured in the Supabase dashboard before the flows work in production.

## ADR-011: Creator goals with webhook-verified progress

### Status
Accepted (July 2026)

### Context
Goal-based support is the product's core differentiator, and the hard rules forbid invented totals. Creators need real Goals (Product Wave 1), supporters need to see honest progress, and gifts must be attributable to a specific Goal without touching the destination-charge money flow.

### Decision
A `creator_goals` table owns the Goal lifecycle (`draft → active → completed/archived`, revival via draft; completion is always the creator's manual call, over-target is allowed and displayed honestly). Amounts are integer minor units with the gifts-table naming convention (`target_amount`, `raised_amount`). Progress is a denormalised `raised_amount` maintained **only** by trusted server code through `apply_goal_contribution()` — a single atomic UPDATE invoked from the verified Stripe webhook path (positive on payment, negative on refund/dispute withdrawal); no client column grant for it exists, and execute is revoked from client roles. Attribution is a nullable, indexed `gifts.goal_id` FK (`on delete restrict` — funded goals are archived, never deleted). At most 3 active goals per creator (`MAX_ACTIVE_GOALS` in `lib/goals/types.ts`, mirrored by a DB trigger); a funded goal's currency is frozen by trigger. RLS: everyone reads active/completed goals, owners read and manage all their own. The typed domain boundary lives in `lib/goals/`, mirroring `lib/payments/`.

### Alternatives considered
Computing progress by aggregating gifts per request — correct but couples every public page read to the gifts table and its column-privilege model; rejected in favour of one denormalised value plus a reconciliation cross-check. Manual raised amounts — violates the no-invented-totals rule. Auto-completing goals at target — removes creator agency and invites premature closure.

### Consequences
Goal progress is real by construction; a goal with zero attributed gifts honestly shows zero. Reconciliation must cross-check `raised_amount` against attributed paid gifts (extended in the attribution issue). The active-goal limit lives in two places (TS constant + DB trigger) and must change together.

## ADR-012: Supabase Storage for user-uploaded media

### Status
Accepted (July 2026)

### Context
Creator profiles need avatars (Product Wave 1). The database already lives in Supabase (ADR-008); user uploads need public serving, owner-scoped writes and hard type/size limits without introducing a new provider.

### Decision
Use Supabase Storage. Buckets are created in migrations, not the dashboard. First bucket: public-read `avatars` with a 2 MB `file_size_limit` and a jpeg/png/webp MIME allowlist, path convention `{user_id}/avatar` — storage RLS lets a user write only inside their own folder. The upload route additionally validates size, MIME type and magic-byte signatures server-side (`lib/profile/avatar.ts`), uploads with `upsert: true` to one extensionless object per user (replacement never orphans objects), and stores the public URL with an upload-version query on `profiles.avatar_url` to defeat stale caches. No image transformation pipeline yet.

### Alternatives considered
URL-only avatar field — poor experience and a content-safety hole (arbitrary external images). A separate object store (S3/R2) — a second provider and credential set for no current benefit. Signed/private serving — avatars are public page content by definition.

### Consequences
Anything uploaded to `avatars` is world-readable — the UI says so plainly. Goal/cover images and any resizing pipeline are follow-up decisions; the per-user-folder RLS pattern is the template for future buckets.

## ADR-013: Transactional email via Resend

### Status
Accepted (July 2026)

### Context
Product Wave 1 introduced payments, goals and early-access capture, but the platform had no way to email anyone. The gift-notification queue (ADR-009) was built anticipating a provider ("a delivery worker drains rows with status pending"). We need Creator and Supporter notifications without coupling delivery to payment processing, and without faking success when unconfigured.

### Decision
Use Resend behind an isolated `lib/email/` boundary. A single `sendEmail()` primitive owns provider details, honest "not-configured" handling and privacy-conscious logging (kind + outcome only — never addresses, subjects or bodies). Templates are pure string builders (HTML + text, brand colours inlined, all user content HTML-escaped). Four transactional emails ship:

- **Gift received → Creator** and **Goal reached → Creator**: enqueued in the creator-scoped `gift_notifications` queue and drained by `deliverPendingNotifications()` (exposed at `POST /api/notifications/deliver`, admin- or cron-bearer-gated). Fully decoupled; idempotent via the `(gift_id, type)` unique constraint. Goal-reached fires once, only when a gift crosses the target (goals never auto-complete, ADR-011).
- **Gift receipt → Supporter** and **Early-access welcome**: sent directly (best-effort, never throw) from the webhook / signup route. Not queued — the Supporter may be anonymous with no profile row, and their email must never sit in a Creator-readable payload; the welcome has no payment to gate on.

Recipient addresses live in `auth.users`, so delivery resolves them via the service-role admin client (`getUserEmail`). Configuration fails safe: with no `RESEND_API_KEY`/`EMAIL_FROM`, every send reports "not-configured" and nothing is faked.

Magic-link **sign-in** emails are deliberately out of scope for this boundary — Supabase Auth sends them. They are routed through Resend by pointing Supabase's SMTP settings at Resend in the dashboard (docs/email-setup.md), not by app code. There is no "password reset" email: auth is passwordless (ADR-010).

### Alternatives considered
A generic `email_outbox` table for all four emails — cleaner uniformity but a new table and migration for two emails that have no Creator profile to key on; deferred until a second non-creator notification appears. Sending the creator gift email inline from the webhook — rejected: it recouples delivery to payment, the exact thing ADR-009's queue avoided. Supabase Edge Functions for delivery — a second runtime for no current benefit.

### Consequences
The delivery worker needs a scheduler (Vercel Cron) calling `/api/notifications/deliver`; until then an admin can trigger it. Transient send failures leave queue rows "pending" for retry; terminal failures (no recipient email, unknown type) are marked "failed" for inspection. Newsletter/broadcast sending is explicitly not built. Email templates are hand-rolled HTML — if they proliferate, a rendering library becomes worthwhile.

## ADR-014: Creator-authored markdown, rendered through a sanitiser

### Status
Accepted (July 2026)

### Context
The creator-profile v2 introduces long-form creator content — an "About" section and "Project Updates" — that creators author themselves. The marketing site deliberately used typed TypeScript content with no CMS/MDX (see the stack skill), so this is the first place the platform renders **arbitrary user-authored rich text**. Rendered naively, markdown-to-HTML is a stored-XSS vector.

### Decision
Store the raw markdown source in the database (`profiles.about`, `creator_updates.body`) and render it only through a single `Markdown` component built on `react-markdown` + `remark-gfm` (full GitHub-flavoured formatting) piped through **`rehype-sanitize`** with its default safe schema. No raw HTML, `<script>`, event handlers or `javascript:` URLs survive; element styling is applied by our own component mappings, never taken from the input. Links render with `rel="noopener noreferrer nofollow"` and `target="_blank"`.

Live third-party **embeds** (YouTube/Instagram "Pinned Media") are deliberately kept OUT of the markdown path — they are a separate structured feature rendered as hardened `youtube-nocookie`/sandboxed iframes, so the markdown pipeline stays a closed, always-sanitised subset even though the product offers "full markdown + live embeds".

### Alternatives considered
`@tailwindcss/typography` (`prose`) for styling — avoided a dependency by mapping elements directly; revisit if content styling grows. Allowing raw HTML in markdown (`rehype-raw` without sanitising) for richer authoring — rejected outright as an XSS hole. A server-side sanitise-on-write approach — rejected: sanitising on render keeps the stored source faithful and puts the guarantee at the one place HTML is produced.

### Consequences
Creators get bold/italic/headings/lists/tables/links/images but not arbitrary HTML or inline embeds — a deliberate ceiling. If richer authoring is ever needed it must extend the sanitiser schema explicitly, per element, with review. The same `Markdown` component is the single rendering path for all future user-authored text.

## ADR-015: Discover page — cross-creator listing with a hybrid real/Preview fallback

### Status
Accepted (July 2026)

### Context
Until now every profile and goal read was single-creator (`getPublicGoalsForCreator`, `loadProfile` — all filtered by one `username`/`creator_id`). The Discover page is the platform's first surface that must list creators and goals **across all creators** so a supporter with no specific creator in mind can browse and back a journey. Two constraints shape it: the CLAUDE.md hard rules forbid inventing users, supporter counts or payment totals (`raised_amount` is webhook-only, ADR-011); and at build time the platform has few or no real creators, so a listing that shows only real data would render an empty, lifeless page during validation.

### Decision
Add a `lib/discover/` domain boundary with cross-creator reads on the **anonymous** client (`queries.ts`), relying on RLS rather than hand-written filters for safety: `profiles` hides deactivated rows from anon, so an `inner` join to `profiles` also drops a deactivated creator's goals; `creator_goals` exposes only `active`/`completed` to anon; `creator_updates` only `published`. No admin/service-role client is used for the public listing.

The page is **hybrid** (`data.ts` `getDiscoverData()`): each section renders real, verified data when it exists and otherwise falls back to clearly-labelled **Preview** content (ADR-007) from `lib/content/preview-creators.ts`. A creator is discoverable if they have a public page (`role = 'creator'`) **or** own any publicly-visible goal — the `role` flag alone would hide real creators who set up a goal without it. Two sections that need a data pipeline we don't have yet — **Trending** (no view/velocity signal) and **Recently Funded** (no privacy-safe public gift feed) — are always shown as Preview/Concept placeholders, never fabricated as real. If Supabase is unconfigured every real read fails safe to empty and the whole page renders as honest Preview. The page is statically generated with `revalidate = 300`.

### Alternatives considered
Admin (service-role) client for the listing, mirroring `app/t/[username]` — rejected: it bypasses RLS and would require re-implementing every public-visibility filter by hand, exactly the "filter someone could forget" risk `getPublicGoalsForCreator` was designed to avoid. A real-data-only page — rejected for the validation phase: it would be empty until creators join, defeating the "inspire exploration" goal. A fully fictional concept page — rejected: it cannot surface the real creators/goals that already exist and would drift from reality at launch. Adding a `category` column now to power real category filtering — deferred: categories ship as browse facets over Preview content until creators can self-categorise.

### Consequences
Discover is the one place that reads across creators; any future ranking (real trending, near-completion feeds) extends `lib/discover/`. Trending and Recently Funded remain Preview until a support-velocity signal and a privacy-respecting activity feed exist. Category filtering only narrows Preview content until a real `category` field is added to profiles/goals. Preview content in `lib/content/preview-creators.ts` is fictional and must stay behind Preview/Concept labels; it is illustrative, not seed data.
