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

## ADR-016: Creator-initiated sharing — web intents + per-creator OG cards, no auto-posting

### Status
Accepted (July 2026)

### Context
A proposal to auto-post to a creator's X account on every gift was rejected: posting on someone's behalf needs revocable, per-account OAuth write access; per-gift automation trips X's spam heuristics and risks suspending creators' own accounts; the paid X API is a heavy external dependency; broadcasting every gift can expose supporters who gave quietly; and reflexive "someone donated" posts fight the *Support the journey* brand (CLAUDE.md forbids donation/crowdfunding framing and inventing supporter data). The underlying goal — social proof and awareness — is still worth serving, pulled rather than pushed.

### Decision
Sharing is always **creator-initiated and manual**. `components/share-controls.tsx` (client) offers "Post to X" via the standard `twitter.com/intent/tweet` web-intent (pre-fills text + URL, the creator reviews and sends — no API, no token, no automation), plus copy-link and the Web Share API where available. Share copy lives in a pure, tested `lib/goals/share.ts`: `reachedMilestone()` reports the highest of 25/50/75/100% a goal has **honestly** reached (reusing `goalProgressPercent`, capped, 100 only when the target is actually met), and the compose helpers are first-person, on-brand, and never fabricate amounts or supporter counts. The goal manager surfaces a milestone prompt on active goals that have crossed a threshold and a plain share elsewhere; completed goals use a completion message that does not assert a funding level (completion is the creator's call, ADR-011). Milestone state is derived live from `raised_amount`, never persisted — there is no "already shared" flag and no new table.

The shareable **card** is a per-creator dynamic OG image at `app/t/[username]/opengraph-image.tsx`, generated from the same verified data as the public page (top active goal's title + honest progress) and degrading to a generic "Support the journey" card when there is no goal or Supabase is unconfigured, so a shared link never unfurls broken. `app/t/[username]` `generateMetadata` points `openGraph.images`/`twitter.images` at that route; the page stays `robots: noindex` (pre-launch) — that governs search indexing, not social unfurls.

### Alternatives considered
Auto-posting on every gift via the X API — rejected (consent, spam/suspension, cost, privacy, brand, all above). Milestone-only auto-posting behind per-creator opt-in — deferred: still needs OAuth + an integration boundary and its own ADR; revisit only if validation shows creators want it. Persisting which milestones were shared — rejected as premature; live derivation is honest and stateless. A per-goal public URL + per-goal OG route — deferred: goals are not individually addressable (no slug, ADR-011), so the card is per-page and highlights the top active goal.

### Consequences
No external social dependency, no stored tokens, no automation to secure. Awareness is pull-based (rich unfurls + one-tap compose) rather than push. If true auto-posting is ever wanted it is a net-new, opt-in integration boundary, not an extension of this. The card reads a creator's top active goal only; multi-goal or per-goal cards would extend the OG route. `lib/goals/share.ts` is the single source of share copy — keep brand vocabulary and the no-invented-data rule there.

## ADR-017: Multi-currency payout countries (2-decimal only)

### Status
Accepted (July 2026)

### Context
Payments launched GBP/EUR-only (ADR-009): `SupportedCurrency` was `"gbp" | "eur"`, `getAllowedConnectCountries` defaulted to the UK plus euro-area countries, and `defaultCurrencyForCountry` was a binary `GB ? gbp : eur`. The target markets are broader — English (UK, US, Canada, Australia, NZ, Ireland…), German, French, Spanish, Italian and Portuguese — so creators in the US, Canada, Australia, NZ, Italy, Switzerland and the Nordics could not onboard. Because a Stripe Connect account's **settlement currency is fixed by its country**, expanding payout countries is inseparable from expanding supported currencies. The whole payment domain works in **integer minor units** and `formatMinorAmount`/`parseMajorAmountToMinor` assume 100 minor units per major unit, so any zero-decimal currency (JPY, KRW) would silently corrupt amounts.

### Decision
Expand to ten **2-decimal** currencies — `gbp, eur, usd, cad, aud, nzd, chf, sek, nok, dkk` — covering English + EU core and Switzerland + Nordics. A single source of truth, `lib/payments/countries.ts` (`CONNECT_COUNTRIES`: code → name → currency, plus `countryFlagEmoji`/`countryName`/`defaultCurrencyForCountry`), replaces the duplicated country data that previously lived half in `config.ts` and half in the settings page. `config.ts` builds its per-currency `paymentFeeFixed`/`minimumGift`/`maximumGift`/`PRESET_GIFT_AMOUNTS` records by mapping over `SUPPORTED_CURRENCIES` with documented per-currency defaults (kr currencies scaled ~10×), each overridable via `STRIPE_<NAME>_<CUR>`. A DB migration adds the eight new values to the `payment_currency` enum. The country picker becomes an accessible, flag-badged custom listbox (`components/payments/country-select.tsx`) following the house disclosure pattern (`account-menu.tsx`) — a native `<select>` cannot style its OS-drawn option list.

**Japan and Korea are explicitly deferred**: JPY/KRW are zero-decimal and would require threading a per-currency minor-unit exponent through `formatMinorAmount` and `parseMajorAmountToMinor`. That rework is out of scope; adding them without it would produce 100×-wrong amounts.

### Alternatives considered
Adding JPY/KRW now with the current 2-decimal math — rejected: it silently multiplies every Japanese/Korean amount by 100. Keeping the native `<select>` and only restyling its trigger — rejected: the open option list stays OS-rendered and unbranded (the original complaint). Leaving country data spread across `config.ts` and the page — rejected: two lists that must agree drift apart. Using a headless UI library for the dropdown — rejected: none is installed and the repo hand-rolls disclosures (`account-menu.tsx`, `share-controls.tsx`).

### Consequences
Creators in ~19 countries can onboard with the correct settlement currency. `lib/payments/countries.ts` is now the one place to add a currency+country (add the enum value, add the row; 2-decimal only). Which countries are actually offered is still gated operationally by `STRIPE_CONNECT_ALLOWED_COUNTRIES`, because onboarding each depends on the platform's Stripe account supporting cross-border Connect to it — the code fails safe when Stripe rejects an unsupported country. Supporting zero-decimal currencies (JPY/KRW) remains a follow-up requiring the minor-unit-exponent rework. Locking a goal's currency to the creator's payout currency (`goal-form.tsx` still lists all currencies) is a separate follow-up.

## ADR-018: Creator wish lists — outright, one-and-done, reusing the gift path

### Status
Accepted (July 2026)

### Context
Creators wanted a way to let supporters fund **specific, tangible things** (a box of balls, a driver, a tournament entry, flights, "buy me a beer") alongside larger Goals — making *Support the journey* concrete without becoming a storefront. Two funding models were possible: **outright** (one supporter funds the whole item in one charge) and **chip-in** (many supporters part-fund, with a progress bar). The existing payment stack is one-time Stripe Checkout destination charges (ADR-009); Goals (ADR-011) already provide the owner-scoped CRUD / RLS / `sort_order` / cover-image / gift-attribution pattern to mirror.

### Decision
Ship **outright, one-and-done** wish lists v1. A wish is funded by a single ordinary destination charge — **no new Stripe primitives** (no Prices, Customers, subscriptions, or new webhook events). New `public.wishlist_items` table mirrors `creator_goals` (title, description, image, currency, `price_amount`, `status` `draft→active→funded→archived`, `sort_order`); `public.gifts.wishlist_item_id` mirrors `goal_id`, with a `gifts_single_attribution` CHECK enforcing a gift funds a goal **or** an item, never both. Domain boundary is `lib/wishlist/` (`types`, `item-schema`, `items` CRUD, `public` read, `funding` webhook-write). Item images reuse the existing public **`covers`** bucket (folder-namespaced RLS) — no new storage migration.

**Funded state is service-role only, exactly like `raised_amount` (ADR-011):** `funded_by_gift_id`/`funded_at` and the `'funded'` status have **no client write grant**, a CHECK ties `'funded'` to a non-null `funded_by_gift_id`, and `canTransitionWishlistItem` never targets `'funded'` — so a creator can **never invent a purchase**. The verified webhook path (`markGiftPaidVerified`) flips the item to `'funded'` behind the exactly-once paid transition, guarded on `status='active'` so two simultaneous funders resolve cleanly (the loser is still a recorded gift). A **full** refund or lost dispute reverts the item to `'active'` (partial refund leaves it funded — the supporter paid the bulk). Because a wish is funded by ONE charge, `lib/wishlist/items` reuses `calculateFees()` to reject any price outside the single-gift min/max at create/edit time, so every published item is fundable. Public UI: `PublicWishlist` cards with "Fund this" drive the existing `GiftComposer` (which locks the amount to the item price and sets `wishlistItemId`) via a tiny client `FundProvider` context; creator UI is `WishlistManager` at `/dashboard/wishlist`.

### Alternatives considered
**Chip-in / part-funding now** — deferred: it is essentially a Goal with an item framing (progress accounting, concurrency, refund-vs-progress reconciliation) and would reuse `apply_goal_contribution`; outright is the simpler, lower-risk first cut and chip-in slots in later. **Repeatedly-fundable small items** ("a running beer fund") — deferred to the future subscriptions/recurring work; v1 items are one-and-done. **A new storage bucket for item images** — rejected: the `covers` bucket's per-user-folder RLS already fits (`wishitem-<id>` path). **A direct per-card checkout** bypassing the composer — rejected: it would duplicate sender-name/message/receipt collection; the `FundProvider` bridge reuses the composer intact.

### Consequences
Wish lists ship with no new Stripe surface, no supporter accounts, and no fee-model change — the whole risk is contained to one migration + one domain boundary + UI. **A practical limit:** an item's price must fit the single-gift **maximum** (default `STRIPE_MAX_<CUR>`, e.g. £500 for GBP), so higher-value items (a premium driver, long-haul flights) need that env limit raised or aren't fundable in one Tee — surfaced honestly at item-create time. Chip-in, repeatedly-fundable items, and a supporter-facing "who funded what" feed are follow-ups. `lib/wishlist/funding.ts` is the single funded-state writer — keep the no-invented-purchase discipline there.

## ADR-019: Full internationalisation — next-intl, locale-prefixed routes, English as source

### Status
Accepted (July 2026)

### Context
The product needed complete localisation in eight languages (en, de, fr, es, it, ja, ko, pt) across every surface: marketing pages, discovery, creator pages, the authenticated dashboard/settings/admin, checkout, validation and API errors, transactional emails, legal pages and all SEO metadata — plus SEO-correct per-locale URLs, locale persistence and CJK typography. Constraints: the marketing pages must stay statically generated (ADR-010's middleware discipline), payment logic must not change, user-generated content must never be machine-translated, and English legal text remains the governing version.

### Decision
Adopt **next-intl** (the only mainstream App Router-native i18n library) with `localePrefix: "always"`: every page moves under `app/[locale]/` and URLs carry the locale (`/en/discover`, `/de/t/<username>`). English is the **source and guaranteed fallback**: locale catalogs (`messages/<locale>/<namespace>.json`, one file per feature) are deep-merged over the English catalog at load time, so a missing key renders English — never a raw key. Typed message keys are derived from the en catalog (invalid keys fail `tsc`). `middleware.ts` becomes `proxy.ts` composing next-intl's locale handling (unprefixed URLs 307-redirect via cookie → Accept-Language → en; `NEXT_LOCALE` cookie maintained) with the Supabase session refresh, which is path-gated so marketing requests still never touch Supabase; every layout/page calls `setRequestLocale` so marketing routes stay SSG (×8 locales). SEO: self-referencing locale canonicals, hreflang for all locales + `x-default`→en, per-locale og:locale, localized JSON-LD `inLanguage`, and a sitemap emitting every indexable route × locale with full alternates; noindex surfaces stay noindex. Errors: schemas and API routes return stable codes (`{ code, params }` into the `errors` namespace) rendered client-side (`useErrorMessage`), never English wire strings. Formatting: `lib/i18n/format.ts` (pure `Intl.*`, explicit locale) replaces the hand-rolled currency formatter and hardcoded `en-GB` dates; amounts stay canonical minor-unit integers. Persistence: `profiles.preferred_locale` (user choice, read at email-delivery time) and `gifts.locale` (supporter's checkout language for receipts); Stripe Checkout receives the locale and returns to locale-prefixed URLs. Long-form content (blog articles, legal documents) stays typed TypeScript with per-locale registries and en fallback; short content strings (FAQs, support options, preview content, image alts) live in message catalogs where the parity tooling (`npm run i18n:check` + a vitest parity suite) can verify them. CJK: Noto Sans JP/KR via Google Fonts stylesheet links on ja/ko pages only (next/font cannot sensibly bundle the hundreds of unicode-range slices), with `html:lang()` font-variable overrides since Fraunces has no CJK glyphs. Legal translations render a "for convenience — English governs" notice and are flagged for professional legal review.

### Alternatives considered
`next-i18next`/`react-intl` — rejected: weak or no RSC/App Router support. Hand-rolled i18n — rejected: ICU plurals (ja/ko/others) and ~1,400 strings make it a false economy. Locale in a cookie without URL prefixes — rejected: uncrawlable, uncacheable per-language, breaks shareability and hreflang. `localePrefix: "as-needed"` (bare English URLs) — rejected: two URL shapes for one language complicates canonicals/redirects; a one-time 307 from legacy URLs is cleaner. Bundling CJK fonts via next/font — attempted, failed at build (hundreds of font-slice fetches); stylesheet link chosen deliberately as a documented self-hosting exception. Storing a locale on `gift_notifications` — rejected: delivery-time resolution from the profile means a creator who switches language gets subsequent emails in the new one and the queue stays semantic.

### Consequences
Eight locale variants of every page with correct SEO signals; existing links keep working via redirects; auth/Stripe callback URLs unchanged (route handlers stay unprefixed). Adding a locale = one entry in `i18n/locales.ts` + a message directory + DB check-constraint extension + Stripe locale mapping + content registries (pt-BR slots in without restructuring). All non-English copy is AI-translated pending native review; legal translations must not be relied on before professional review. The 2-arg `formatMinorAmount` survives only as a deprecated English shim. The parity checker fails CI when a locale declared complete (messages/manifest.json) drifts from the en catalog. Ops notes and developer workflow: docs/i18n.md.

### Update (2026-07-28) — CJK fonts fully self-hosted, stylesheet exception withdrawn
The original decision loaded Noto Sans JP/KR from `fonts.googleapis.com` / `fonts.gstatic.com` via a `<link rel="stylesheet">` on ja/ko pages, treated as a documented self-hosting exception. This was a **GDPR defect**: a runtime request to Google Fonts discloses the visitor's IP address to a US third party without consent — the exact scenario behind the German "Google Fonts" case law (LG München I, 20 Jan 2022, 3 O 17493/20). It is now removed. CJK faces are self-hosted via `next/font/local` (`lib/fonts.ts`) against woff2 files committed under `app/fonts/` (full japanese/korean subsets, weights 400/700, sourced from Fontsource) — so **no request reaches Google at runtime or build time**, builds are deterministic (no dependency on fetching the hundreds of unicode-range slices next/font/google pulls for a CJK family), and the browser still only downloads a CJK face on ja/ko pages (`html:lang()` scoping in `app/globals.css`). Latin faces (Inter, Fraunces) stay on `next/font/google`, which downloads at build and serves from our origin — also no runtime Google request. The `preconnect` links to the Google font hosts were removed from the locale layout. Legal pages (privacy, terms, Impressum, accessibility) were additionally set `robots: noindex, nofollow` and dropped from the sitemap so the operator's name and address stay out of search results.

## ADR-020: Owner analytics dashboard — email-gated, read-only aggregation, dependency-free charts

### Status
Accepted (July 2026)

### Context
The founder needs to track platform performance — sign-ups per day/week/month, the Stripe onboarding funnel, gift volume and platform commission per currency, week-on-week / month-on-month / year-on-year progression, acquisition and churn — visible **only to his owner account** (`simon@chipputtputt.com`), including on mobile. The existing `/admin` area is gated by the `admin_users` table, which grants *operational* admin (refunds, moderation, user management) — a different trust boundary from company-performance financials. No charting library exists in the repo (deliberately: "Lucide icons; no other UI framework").

### Decision
Add `/admin/analytics` (all locales), guarded by a **verified-email allow-list**, not `admin_users`: `lib/admin/analytics-access.ts` compares the Supabase-verified auth email (magic-link sign-in means the email is proven) against `ANALYTICS_OWNER_EMAILS` (env, defaulting to the founder's address). Everyone else — including operational admins — gets the same plain 404 as the rest of `/admin`; the nav tab is likewise server-decided in the admin layout and hidden from non-owners. Data: `lib/admin/analytics.ts` is a **pure aggregation core** (`buildAnalyticsSnapshot(rows, now)` — unit-tested without Supabase) behind a thin paged service-role fetch. Honesty rules are structural: money is never summed across currencies (ADR-017); revenue counts **live-mode** gifts in the paid family only (test-mode gifts surfaced as an excluded count); refunds are reported against supporter totals, never netted into gift figures; growth uses **rolling windows** (7/30/365 days vs the window immediately before) so partial periods can't flatter a trend; churn is defined as account deactivations — the only exit signal recorded today — and the page says so. Charts are **hand-rolled server-rendered SVG** (`components/admin/analytics/`), stacked bars with native-title hovers, paired with tables so no value is gated behind a graphic; series colours are two new tokens (`--color-chart-green/gold`) — the brand hue families snapped to steps that pass colour-vision-deficiency and contrast checks. Everything is server components; wide charts/tables scroll horizontally on mobile instead of shrinking below legibility.

### Alternatives considered
Gating by `admin_users` — rejected: it conflates operational admin with owner financials and would show revenue to any future moderator. A hardcoded email without env override — rejected: changing the owner address must not need a deploy. Adding Recharts/Chart.js — rejected: a client-side charting dependency for one owner-only page contradicts the no-extra-UI-framework rule and would ship JS the page doesn't need. SQL-side aggregation (views/RPCs) — deferred: at current volumes a paged fetch + pure in-memory aggregation is simpler, fully unit-testable, and adds no migration; revisit if row counts make the fetch heavy. Dormancy-based churn — deferred honestly: without subscriptions or longer history any number would be invented.

### Consequences
The founder sees real figures only (empty states until data exists — nothing is ever invented, per the hard rules). The email gate is a second access mechanism alongside `admin_users` — keep it single-purpose for owner analytics; operational features must keep using `isAdmin`. The admin layout now reads the session cookie to decide nav visibility (admin routes were already dynamic). When gift volume grows large enough that fetching all rows per view is wasteful, move aggregation into SQL behind the same snapshot interface. JPY/KRW analytics inherit the ADR-017 zero-decimal deferral.

## ADR-021: Brand repositioning — "For Golfers With a Goal.", audience registry, homepage ISR, pricing from config

### Status
Accepted (July 2026)

### Context
The founder repositioned the marketing site away from a "buy me a coffee" clone toward *the platform where golfers fund their ambitions*: primary strapline **"For Golfers With a Goal."**, core message "Every golfer has a goal. BuyMeATee helps them achieve it." The brief asked for a goal-first homepage (audience cards, featured golfers, why-supporters, pricing), nine dedicated audience landing pages for long-tail SEO (creators, tournament players, juniors, college golfers, travelling players, charity golfers, club professionals, coaches, podcasters), and SEO coverage of searcher terms ("golf crowdfunding", "golf donations") the brand vocabulary bans as self-description. Constraints: 8-locale parity (ADR-019), no invented users/testimonials, junior pages guardian-led, honest payment claims only.

### Decision
**Strapline hierarchy:** "For Golfers With a Goal." becomes the brand primary (meta default title, hero eyebrow, footer, OG image); "Support the journey" survives only as the supporter-facing phrase (share texts, creator OG image, profile kickers, emails) — those surfaces are deliberately unchanged. **Audience registry:** `lib/content/audiences.ts` is the single typed source of truth (slug, message-key id, icon, image slot, example-goal refs, SEO keyword, related links, `guardianLed` flag) driving one dynamic route `app/[locale]/for/[audience]/page.tsx` (blog pattern: `generateStaticParams` + `dynamicParams=false` → 9 × 8 SSG pages), the homepage audience grid, the `/for-creators` hub cards (its old who-grid text chips became registry-driven links), a fourth footer column, and registry-derived sitemap entries (`staticRoutes` stays literal-only). Copy lives in a new `audiences` namespace; the junior page is guardian-addressed with a dedicated notice pinned by `guardianLed` in tests. Audience pages emit FAQPage JSON-LD matching the three visible questions; no Service/Offer schema (nothing priced to describe). **Homepage ISR:** the new featured-golfers section reuses the Discover hybrid rule via `getFeaturedGoals()` (`lib/discover/data.ts`) — real published goals or labelled Preview fallback — so the homepage moves from pure SSG to `revalidate = 300` (same as `/discover`), failing safe to all-Preview without Supabase. **Pricing from config:** the homepage pricing section renders percentages from `getFeeConfig()` via ICU args — fee copy can never drift from the configured fee model; fixed fees are described qualitatively ("small fixed processing fee") because they are per-currency env values. **Banned-term SEO:** searcher intent for "golf crowdfunding"/"golf donations" is addressed by one blog article (`looking-for-golf-crowdfunding`) that names the terms as what people search and positions goal-based support as the alternative — the vocabulary rule bans self-description, not honest contrast. Testimonials/trusted-by sections were rejected outright (no real users to quote; hard rule against invention).

### Alternatives considered
Nine static route folders — rejected: nine drifting copies of one template; the registry gives one component and one wiring point. Repurposing `/for-creators` into a `/for/*` page — rejected: it keeps indexed equity and works better as the hub. A `tipJar`-style "not a tip jar" section — replaced by "Why supporters give": the reposition asserts what BuyMeATee *is* rather than what it isn't. Hardcoded fee percentages in copy — rejected: `STRIPE_PLATFORM_FEE_BPS`/`STRIPE_PAYMENT_FEE_PERCENT` are env-tunable and copy must follow. A Concept-labelled testimonial section — rejected as trust-corrosive even labelled.

### Consequences
The homepage build output is ISR (5-minute revalidate) rather than fully static — acceptable, matching `/discover`. 72 new SSG pages and one new article ship in all locales; translations are AI-generated pending native review (ADR-019 status quo) and were grep-checked for donation/crowdfunding cognates. Frames 02/08/17/19/24 of the contact sheet entered use and joined the hi-res sourcing list; frame 24 stays confined to guardian-framed contexts. `home` namespace lost `tipJar`/`audiences`/`supportOptions`/`creatorPreview`; `marketing.forCreators.who.audiences` was removed in favour of registry labels. Follow-ups: bespoke hi-res audience imagery, per-audience OG images, and real featured-golfer curation once enough live goals exist.

## ADR-022: Share Moments — event-triggered sharing prompts, supporter sharing, optional AI copy

### Status
Accepted (July 2026)

### Context
ADR-016 established creator-initiated sharing (web intents, honest milestone copy in `lib/goals/share.ts`, per-creator OG cards) but only on the goals page and the received-Tees list. A viral-growth brief asked for every meaningful event to become a shareable moment — page goes live, an update is published, a wish is funded, and, critically, the **supporter** side after checkout — plus AI-personalised copy and Instagram-friendly image + caption flows. Constraints carried over unchanged: never post on anyone's behalf, never invent amounts/counts/results (CLAUDE.md hard rules), brand vocabulary (support/journey/Tee, never donation), all copy localised in 8 locales (ADR-019), and new external services must fail safe.

### Decision
Extend the ADR-016 machinery rather than build a parallel "SocialShareService". `lib/goals/share.ts` stays the single source of share-copy selection and gains event selectors: `pageLiveShareText`, `updateShareText`, `wishlistFundedShareText`, and the first supporter-voice selector `supporterShareText(recipientName, target)` — first-person from the supporter, naming the creator and the goal/item but never the amount. Strings live in `gifts.share.*` across all 8 locales. A new `components/share-moment.tsx` renders a "share moment": celebratory card with the suggested post **visible in an editable textarea**, the existing `ShareControls` channels (X, Bluesky, WhatsApp, Facebook, LinkedIn, copy link, native share), a copy-caption button (text + URL, for Instagram-style paste flows), and an optional "Download share image" link to the existing per-creator OG card. Surfaces: the gift thanks page shows the supporter prompt **only in the webhook-verified `paid` phase** (never `confirming`/`pending` — the share must not precede proven payment) and is pure opt-in with a privacy note; `UpdateManager` shows a dismissable moment right after a publish action plus a persistent "Share this update" control on published updates; `WishlistManager`'s webhook-set `funded` note gains share controls; the profile form's "page is live" card gains a share button (`pageLive` copy). Milestone prompts remain as shipped in ADR-016.

**AI personalisation is an optional, fail-safe layer over the templates** (never a replacement): `lib/share/personalise.ts` (server-only, official `openai` SDK — chosen because the founder holds an OpenAI key — model `gpt-4o-mini` overridable via `SHARE_AI_MODEL`) builds a prompt enforcing the honesty and brand rules, and post-validates the suggestion (length cap, no donation/crowdfunding vocabulary, no smuggled URLs) — a failing suggestion is dropped in favour of the template. `POST /api/share/personalise` is auth-gated (signed-in creators only — each call costs money) and rate-limited; with no `OPENAI_API_KEY` it returns 503 and the button reports itself honestly unavailable. The output is only ever a suggestion in the editable textarea; the user reviews and posts everything themselves. The provider is confined to this one module behind a provider-neutral interface (`personaliseShareCopy` → `string | null`), so swapping vendors is a one-file change.

### Alternatives considered
A new `SocialShareService` abstraction (per the brief) — rejected: `lib/goals/share.ts` + `ShareControls` already are that service; a second layer would duplicate ADR-016. Auto-detecting events server-side and queueing share notifications — rejected: sharing is a UI moment, not a pipeline; derivation at render keeps it stateless (same reasoning as milestone state in ADR-016). Offering AI personalisation to supporters on the thanks page — rejected for v1: the endpoint would be unauthenticated and abusable; supporters get the localised templates. Per-event share-card image variants (milestone/support/tournament cards) — deferred: goals have no individual slug (ADR-011/016) and the existing OG card unfurls honestly; revisit with per-goal URLs. Tournament-results sharing — deferred: it needs a new results domain (table, CRUD, honesty rules) and is its own wave. Referral/UTM tracking, hashtags, streaks, badges, year-in-review — deferred follow-ups from the brief.

### Consequences
Every core lifecycle event now ends in an optional, honest, localised share moment; the supporter loop (the brief's growth engine) exists end-to-end. The OpenAI SDK is the repo's first AI dependency — confined to `lib/share/personalise.ts` behind the platform's standard fail-safe pattern; nothing breaks or degrades without the key. AI suggestions are AI-generated content posted under the user's own name only after their review — the post-validation rules in `personalise.ts` are the guardrail; keep them in sync with the CLAUDE.md hard rules. Share URLs remain the plain profile URL (no UTM), so referral attribution is a follow-up. The thanks-page prompt keys off `phase === "paid"` — if new paid-family phases are added, revisit the gate.

## ADR-023: Social Content Studio — AI-drafted calendar, human-published, owner-only

### Status
Accepted (July 2026)

### Context
The platform has very few users, so awareness must be built by consistently posting to X and Bluesky about the mission ("For Golfers With a Goal.") — inspiring ambitious golfers rather than showcasing traction that doesn't exist. The founder needs ~2 posts/day drafted, reviewed and tracked without living in a spreadsheet. Phase 1 explicitly excludes social APIs: no auto-posting, no OAuth tokens (consistent with ADR-016's no-automation stance), no analytics. The CLAUDE.md hard rules bind hardest here: no invented users, testimonials, milestones or traction claims in generated marketing copy.

### Decision
A new owner-only admin area, `/admin/social`, gated by the same verified-email allow-list as `/admin/analytics` (ADR-020) — this is a founder tool, not operational admin. Data: `public.social_drafts` (service-role only, RLS enabled with no policies) holds a rolling calendar of drafts, each carrying a shared brief (pillar, audience, objective, CTA, image recommendation), platform-specific copy for X and Bluesky, and the status workflow `draft → ai_generated → edited → approved → published` (`published_at` stamped on manual publish; edits honestly demote approved drafts back to `edited`). Domain boundary `lib/social-studio/`: `calendar.ts` is a pure, deterministic planner — two slots/day (morning = conversation, afternoon = value; 14/week), six pillars rotated evenly, audience spotlights rotating through the full ADR-021 audience registry, with all rotation keyed to the **absolute day** so week-by-week seeding equals whole-window seeding (regression-tested); `generate.ts` drafts via the shared OpenAI configuration (OPENAI_API_KEY / SHARE_AI_MODEL, ADR-022's fail-safe rule) with a brand-voice prompt that forbids traction claims, testimonials, donation/crowdfunding vocabulary, URLs and hashtag spam, and a post-validator that rejects any draft violating length, duplication (Bluesky must differ from X) or vocabulary rules — failed slots are skipped and retried on the next seed, never filled with unchecked content; `drafts.ts` seeds/lists/updates via the service-role client. Images are recommendations only in Phase 1: `none`, `branded` (a short line for a future branded graphic, previewed as a styled card) or `lifestyle` (an editorial photo prompt to copy into any generator) — `generateDraftImage()` is the documented extension point for the OpenAI Images API. UI: a calendar grouped by day with status/pillar/audience/image filters, per-draft editing, regenerate (copy or image idea), one-click posting via the X / Bluesky compose web-intents (pre-filled with the current text; the founder reviews and sends — same no-API mechanism as ADR-016) plus copy-to-clipboard per network, approve/publish/duplicate, and a week-by-week "generate the next 4 weeks" seeder (≈56 drafts) so no single request times out.

### Alternatives considered
Direct posting via X/Bluesky APIs — out of scope by brief and by ADR-016's reasoning (tokens, spam heuristics, automation risk); the model is designed so a publishing phase only adds a delivery step. Storing drafts in a headless CMS or files — rejected: the workflow is stateful (statuses, regeneration, duplication) and Supabase already provides the service-role pattern. Generating the whole month in one request — rejected: ~56 sequential AI calls exceed serverless limits; the seeder is idempotent per-slot instead. Gating by `admin_users` — rejected: same trust-boundary argument as ADR-020. Localising draft copy — rejected: posts are the founder's voice in English; only studio chrome is translated (×8).

### Consequences
The founder gets one place to plan, refine and track social content, with honesty enforced twice (prompt + validator). OpenAI usage stays behind the single existing key. The seeded calendar lives in the production database as planning state invisible to users. Later phases (image generation, direct publishing, scheduling, analytics, milestone posts once real milestones exist) extend the same content model without schema change. The 60-draft target is met as 56 slots (2/day × 28 days) — inside the brief's 14–18/week band. Duplicate lands +7 days as `edited`, never pre-approved.

## ADR-025: Journey — a social timeline evolved from Updates (Phase 2 core slice)

> Note: ADR-024 is claimed by a concurrent workstream (Printful merch shop); Journey takes ADR-025 to avoid a collision.

### Status
Accepted (built, staged — not released). Migration `20260725193000_journey.sql` not yet applied to any environment.

### Context
The creator profile read like a fundraiser: a flat, published-only `creator_updates` feed with no reactions, media galleries, milestones or return-visit hooks (ADR-014). The Phase 2 brief asks for profiles that feel like *following a golfer's career* — a lightweight social **Journey** with photos, milestone badges, likes and comments, a premium header, and a dashboard that never feels empty. Phase 2 is large (~13 tables, 16 areas); this slice delivers the highest-value vertical and leaves the rest as a documented roadmap.

### Decision
Evolve, don't duplicate: rename `creator_updates → journey_posts` (data, RLS, index and trigger follow the rename) and add `kind` (`update`/`milestone`), optional `goal_id`, `video_url`, `milestone_label`, service-owned `milestone_goal_id`/`milestone_percent`, and denormalised `like_count`/`comment_count`. New tables `journey_media` (multi-image), `journey_comments` (flat, soft-deletable) and `journey_likes` (one per user, PK). Counters are maintained by `SECURITY DEFINER` triggers so a liker/commenter's own RLS can't block the cross-row bump and clients have no write grant on the counters — the numbers can't be inflated. **Likes and comments are signed-in only** (reuse magic-link auth); the post's creator may moderate any comment on their posts, expressed directly in the RLS policies. Domain boundary `lib/journey/` (renamed from `lib/updates/`) with a pure, unit-tested `milestonesCrossed()` reusing `goalProgressPercent` — 100 only registers when the target is met. **Automatic milestone posts (25/50/75/100%) are created as DRAFTS by the verified webhook path only** (`markGiftPaidVerified`, behind the exactly-once paid transition), idempotent via a partial unique index on `(milestone_goal_id, milestone_percent)` — honest by construction, never client-invented, never auto-published (ADR-016/022). `createGoal` seeds a "new goal" draft too. Draft copy is localised at write time via `createTranslator` (like emails). UI adds `ProgressRing`/`MilestoneBadge` primitives, a redesigned header (ring + latest milestone), a sticky in-page tab-nav (About/Journey/Goals/Support) that keeps the page statically generated, the `PublicJourney` feed with client like/comment islands, the dashboard `JourneyManager` (manual milestones, video, goal link), and a `DashboardStats` row of verified figures with honest "coming soon" tiles for recurring support and profile views. New `journey` message namespace across 8 locales. The `update` share-personalise kind is reused for Journey publish shares.

### Alternatives considered
A separate `journey_posts` table alongside `creator_updates` — rejected: two parallel feeds to reconcile, and the "updates" concept *is* the journey. Anonymous or gift-verified likes/comments — rejected: anonymous invites spam with no moderation handle (conflicts with the no-invented-activity honesty stance) and gift-verified adds friction for little gain; signed-in reuses existing auth and gives real identity + moderation. Running the OpenAI call inside the webhook to fill milestone bodies — rejected: adds latency/failure risk to the payment path; drafts carry honest template copy and the creator can "Improve with AI" from the dashboard using the existing personalise route. Real page routes per tab — rejected: an in-page scroll-spy keeps the profile statically generated.

### Consequences
The profile becomes a returnable, social surface without ever overstating reality: progress, milestones, supporters and amounts remain webhook-verified (ADR-011), auto-drafts are always human-reviewed before publishing, and counters can't be inflated by clients. Deferred to later Phase 2 slices (same honesty/i18n/RLS guarantees): profile analytics + `profile_views`/traffic sources, the visual Journey timeline, reputation indicators, recurring-support tables + Stripe subscriptions, in-app notifications, Journey-everywhere on home/discover, and per-post OG images. Multi-image gallery upload exists (table + `/media` route + feed rendering) but is not yet surfaced in the dashboard editor.
