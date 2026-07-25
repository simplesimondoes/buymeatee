# CLAUDE.md — BuyMeATee

Primary entry point for AI development sessions. Read this first, then follow the pointers.

## Product

BuyMeATee is a golf-focused creator-support platform. It helps golf fans support creators, aspiring professionals, amateur competitors, coaches, course reviewers and other golfers as they pursue meaningful goals.

The core proposition is:

> For Golfers With a Goal. — Every golfer has a goal. BuyMeATee helps them achieve it.

The product must feel like a platform where golfers fund their ambitions, not a generic donation platform. "Support the journey" survives as the supporter-facing line (share texts, profile/OG, emails). Repositioning: ADR-021. Full product context: [.ai/context/product.md](.ai/context/product.md).

## Current phase

> Marketing website and product validation.

**The marketing website is implemented (July 2026) and awaiting release.** All Marketing Wave scopes (foundation, audiences, SEO/blog, legal drafts) exist in the repository; see the GitHub milestones and backlog for remaining polish and follow-up work.

Do not build the full application, payments, creator dashboard, supporter dashboard or authentication unless a future issue explicitly introduces them. See [.ai/context/current-phase.md](.ai/context/current-phase.md).

## Release-control rule

**Do not commit, merge, push or deploy completed work unless the user explicitly says: `Release`.**

The default workflow is: Scope → Inspect → Build → Review → Verify → Report → **Pause** → wait for the explicit release instruction.

If the user explicitly instructs a commit, push or deploy as part of a particular task, that instruction overrides the pause rule for that task only. Full process: [.ai/workflows/release.md](.ai/workflows/release.md).

## Current technology

**Implemented (July 2026):**

- Next.js 16 App Router (Turbopack), server components by default — all public pages statically generated
- TypeScript (strict), `@/` import alias
- Tailwind CSS 4 — design tokens as CSS variables in `app/globals.css` (no raw hex in components)
- Fonts via `next/font`: Fraunces (serif headings), Inter (sans body); Noto Sans JP/KR via Google Fonts stylesheet on ja/ko pages only (documented exception, ADR-019)
- **Internationalisation (ADR-019)** — 8 locales (`en` source/fallback, `de fr es it ja ko pt`) via next-intl; all pages under `app/[locale]/` with `localePrefix: "always"`; `proxy.ts` composes locale detection/redirects (URL > `NEXT_LOCALE` cookie > Accept-Language > en) with the path-gated Supabase session refresh; messages in `messages/<locale>/<namespace>.json` deep-merged over English (never raw keys); typed keys from the en catalog; per-locale SEO (self-canonicals, hreflang + x-default, locale sitemap); stable error codes (`lib/i18n/errors.ts` + `useErrorMessage`); locale-aware formatting (`lib/i18n/format.ts`, Intl-based); `profiles.preferred_locale` + `gifts.locale`; localized emails (delivery-time locale resolution) and Stripe Checkout `locale`; parity tooling `npm run i18n:check` + vitest parity suite; glossary `messages/GLOSSARY.md`; dev guide [docs/i18n.md](docs/i18n.md). Translations are AI-generated pending native review; legal translations carry a governing-language notice and require professional legal review
- Lucide icons; no other UI framework
- Typed local content (no CMS, no MDX): `lib/content/` — blog articles, FAQs, goals, support options, images
- Vitest + React Testing Library (`*.test.ts(x)` co-located with source)
- Vercel (production domain: `https://buymeatee.com`)
- Supabase database (project ref `hjpfycbamwwpemsrrsqy`, ADR-008): `profiles` + `early_access_signups` plus the payment domain tables (ADR-009), schema managed via CLI migrations in `supabase/migrations/` (`supabase db push`)
- **Payments: Stripe Connect destination charges via Stripe-hosted Checkout (ADR-009)** — connected accounts (Express dashboard, `transfers` capability), application fees, verified webhooks, refunds, dispute tracking, admin view (`/admin/payments`), reconciliation. Fee model + rules: [.ai/skills/payments.md](.ai/skills/payments.md); operations: [docs/stripe-connect-setup.md](docs/stripe-connect-setup.md). Awaiting Stripe dashboard setup + env vars — fails safely (honest unavailable states) until configured
- **Authentication: minimal Supabase Auth, email magic links only (ADR-010)** — `/sign-in`, `/auth/callback`, cookie sessions via `@supabase/ssr`; middleware matcher covers only authed areas so marketing pages stay static. No passwords, no social providers, no account management UI
- **Creator Goals (ADR-011)** — `creator_goals` table + `lib/goals/` domain boundary; lifecycle `draft → active → completed/archived`, max 3 active per creator (`MAX_ACTIVE_GOALS`, mirrored by DB trigger), minor-unit amounts; `raised_amount` is written only by the verified webhook path via `apply_goal_contribution()` (no client write grant — progress can never be invented); gifts carry an optional `goal_id`
- **Avatars via Supabase Storage (ADR-012)** — public `avatars` bucket created by migration, per-user-folder write RLS, 2 MB jpeg/png/webp limit enforced in bucket config and server-side with magic-byte checks (`lib/profile/avatar.ts`); one extensionless object per user, overwritten in place
- **Discover page (ADR-015)** — `/discover` in the top nav; `lib/discover/` boundary is the platform's first cross-creator public listing (anon client + RLS: published goals, non-deactivated creators, published updates). Hybrid by design: each section shows real verified data when it exists and otherwise falls back to clearly-labelled **Preview** content (`lib/content/preview-creators.ts`, ADR-007). Trending and the Recently Funded activity feed have no data pipeline yet, so they are always Preview/Concept. A shared client context (`components/discover/`) links the hero search + category chips to the browse/filter grid. Statically generated (`revalidate = 300`), fails safe to all-Preview when Supabase is unconfigured
- **Transactional email via Resend (ADR-013)** — `lib/email/` boundary; three emails: gift received → creator and goal reached → creator (queued in `gift_notifications`, drained by `deliverPendingNotifications()` at `POST /api/notifications/deliver`, cron/admin-gated), and gift receipt → supporter (sent directly, best-effort). Single `sendEmail()` primitive, pure HTML+text templates with all user content escaped, privacy-conscious logging (kind + outcome only). Fails safely (honest "not-configured") until `RESEND_API_KEY`/`EMAIL_FROM` are set. Magic-link sign-in emails are Supabase-sent (route via Resend SMTP in the dashboard); no password reset (auth is passwordless). Operations: [docs/email-setup.md](docs/email-setup.md)
- **Creator-initiated sharing (ADR-016)** — manual only, never auto-posting. `components/share-controls.tsx` offers "Post to X" via the `twitter.com/intent/tweet` web-intent (pre-fills, creator sends — no X API, no tokens), copy-link and Web Share. Share copy is pure and tested in `lib/goals/share.ts` (`reachedMilestone()` on honest 25/50/75/100% thresholds; first-person, on-brand, no invented amounts/counts); milestone state is derived live, never stored. Shareable **card** is a per-creator dynamic OG image at `app/t/[username]/opengraph-image.tsx` (top active goal's real progress, generic fallback), wired into the profile page's `openGraph`/`twitter` metadata; the page stays `noindex` (social unfurls still work)
- **Share Moments (ADR-022)** — every lifecycle event ends in an optional, honest share prompt built on the ADR-016 machinery: `components/share-moment.tsx` (editable suggested post + `ShareControls` channels + copy-caption + OG-image download) on the gift thanks page (**supporter voice**, webhook-verified `paid` phase only, pure opt-in with privacy note), after publishing an update (dismissable, plus persistent "Share this update" on published updates), on webhook-funded wish-list items, and on the profile-form "page is live" card. All copy via `lib/goals/share.ts` selectors + `gifts.share.*` in 8 locales. **Optional AI personalisation** (`lib/share/personalise.ts`, official OpenAI SDK, `gpt-4o-mini` with `SHARE_AI_MODEL` override, auth-gated + rate-limited `POST /api/share/personalise`): a suggestion-only layer over the templates, post-validated against the honesty/brand rules, failing safe to templates when `OPENAI_API_KEY` is unset. Never auto-posts; the user reviews and sends everything. Tournament results, referral/UTM tracking, per-event card images deferred
- **Creator Wish Lists (ADR-018)** — `wishlist_items` table + `lib/wishlist/` domain boundary; specific tangible asks (a box of balls, a driver, tournament entry, "buy me a beer") that sit alongside Goals. **Outright, one-and-done**: one supporter funds the whole item in a single existing destination charge (no new Stripe primitives), gifts attribute via `gifts.wishlist_item_id` (mutually exclusive with `goal_id`). `funded` state is service-role only — set exclusively by the verified webhook path (`markWishlistItemFunded`, guarded so races resolve cleanly), reverted on full refund / lost dispute; a creator can never invent a purchase. Item price must fit the single-gift min/max (reuses `calculateFees()`), so items above `STRIPE_MAX_<CUR>` (default £500) aren't fundable in one Tee until that env limit is raised. Public UI: `PublicWishlist` "Fund this" cards drive `GiftComposer` via a `FundProvider` context (amount locked to the item price); creator UI at `/dashboard/wishlist`. Images reuse the `covers` bucket. Chip-in/part-funding and repeatedly-fundable items are deferred follow-ups
- **Multi-currency payout countries (ADR-017)** — creators onboard from ~19 countries across 10 **2-decimal** currencies (`gbp,eur,usd,cad,aud,nzd,chf,sek,nok,dkk`). `lib/payments/countries.ts` is the single source of truth (code → name → settlement currency, `countryFlagEmoji`); `config.ts` builds per-currency fee/min/max/preset records over `SUPPORTED_CURRENCIES` with `STRIPE_<NAME>_<CUR>` overrides; onboarding is gated by `STRIPE_CONNECT_ALLOWED_COUNTRIES` (cross-border Connect). The country picker is an accessible flag-badged listbox (`components/payments/country-select.tsx`). Japan/Korea (JPY/KRW, zero-decimal) deferred until `formatMinorAmount`/`parseMajorAmountToMinor` take a per-currency exponent
- **Brand repositioning "For Golfers With a Goal." (ADR-021)** — goal-first marketing site: homepage flow is Hero → audience grid → how-it-works → featured golfers (hybrid real/Preview via `getFeaturedGoals()`, homepage is ISR `revalidate = 300`) → why supporters give → example goals (10 in content, 6 on homepage) → pricing (percentages from `getFeeConfig()`, never hardcoded) → FAQ preview → CTA. Nine audience landing pages at `/for/<slug>` driven by the `lib/content/audiences.ts` registry + `audiences` message namespace (one dynamic route, 9 × 8 SSG pages, FAQPage JSON-LD, guardian-led junior page); `/for-creators` is the hub; fourth footer column links all nine; sitemap entries derive from the registry. "Support the journey" remains only supporter-facing (share texts, creator OG, emails). SEO article `looking-for-golf-crowdfunding` targets banned-vocabulary searcher intent by contrast, never self-description
- **Social Content Studio (ADR-023)** — `/admin/social`, owner-only (same email gate as analytics): a rolling four-week calendar of AI-drafted posts for X and Bluesky, published BY HAND via X/Bluesky compose web-intents or copy-out (Phase 1 has no social APIs — consistent with ADR-016's no-automation stance). `lib/social-studio/`: pure deterministic planner (2 posts/day, six pillars evenly rotated, audience spotlights covering the full ADR-021 registry; rotation keyed to absolute days so weekly seeding = whole-window seeding), OpenAI generation (shared `OPENAI_API_KEY`/`SHARE_AI_MODEL`, fail-safe) with a post-validator that rejects traction claims vocabulary, banned words, duplicate X/Bluesky copy and over-length posts; `social_drafts` table is service-role only. Status workflow `draft → ai_generated → edited → approved → published`; image recommendations only (`none`/`branded` line/`lifestyle` prompt) with `generateDraftImage()` as the future Images-API extension point
- **Owner analytics dashboard (ADR-020)** — `/admin/analytics`, visible only to the founder's verified auth email (`lib/admin/analytics-access.ts`; `ANALYTICS_OWNER_EMAILS` env override, default `simon@chipputtputt.com`). Other admins get a 404 and no nav tab (tab visibility is server-decided in the admin layout). `lib/admin/analytics.ts` is a pure, unit-tested aggregation core (`buildAnalyticsSnapshot`) behind a paged service-role fetch: sign-ups per day/week/month, Stripe onboarding funnel, per-currency gift volume + commission (live paid-family gifts only; test-mode gifts excluded and surfaced as a count), rolling 7/30/365-day WoW/MoM/YoY growth, deactivation-based churn, repeat-supporter rate. Charts are dependency-free server-rendered SVG (`components/admin/analytics/`) on chart tokens `--color-chart-green/gold` (CVD- and contrast-validated); every chart is paired with a table; wide content scrolls horizontally on mobile

**Update this section whenever the implementation changes.** Stack conventions: [.ai/skills/nextjs-typescript.md](.ai/skills/nextjs-typescript.md).

## Product vocabulary

Use consistently: **BuyMeATee, Creator, Supporter, Goal, Journey, Buy a tee, Support a round, Green fee**.

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

```bash
npm install
npm run lint        # ESLint — must pass clean
npm run test        # Vitest unit + component tests (includes i18n parity suite)
npm run build       # production build (includes type check + typed message keys)
npm run i18n:check  # translation parity: missing/extra keys, ICU mismatches, empties
```

`npm run dev` serves http://localhost:3000 (launch config in `.claude/launch.json`).

Visual changes must also be verified at **375px, 768px, 1024px and 1440px**.

## Repository map

| Path | Purpose |
| --- | --- |
| `app/` | Next.js routes (one folder per route), sitemap/robots/manifest, OG image, icons, API route |
| `components/` | Reusable UI; `components/home/` holds homepage sections |
| `lib/site.ts` | Brand config, navigation and footer links |
| `lib/seo/` | Metadata and structured-data builders |
| `lib/content/` | Typed content: images, example goals, FAQs, support options, blog articles (`articles/`) |
| `lib/discover/` | Cross-creator public listing + hybrid real/Preview aggregation for `/discover` (ADR-015) |
| `lib/payments/` | Payment domain: fees, Connect, gifts/checkout, webhooks, admin, reconciliation (ADR-009) |
| `lib/wishlist/` | Wish-list domain: item CRUD, public read, webhook-only funded-state writer (ADR-018) |
| `lib/stripe/` + `lib/supabase/` | Stripe server client; Supabase server/admin/browser clients |
| `lib/notifications/` | Idempotent gift-notification queue boundary |
| `lib/email/` | Email boundary (ADR-013): Resend client, templates, queue-drain worker, direct sends |
| `docs/` | Operations: Stripe setup, email/Resend setup, deployment/rollback, legal-review list |
| `public/images/` | Imagery — low-res placeholders, see [.ai/context/image-requirements.md](.ai/context/image-requirements.md) |
| `.ai/agents/` | Role definitions to "wear" for specific kinds of work |
| `.ai/skills/` | How this project actually works (stack, SEO, content, forms…) |
| `.ai/workflows/` | Repeatable processes; [wave.md](.ai/workflows/wave.md) is the default |
| `.ai/quality-gates/` | Checklists that gate completion |
| `.ai/context/` | Product, phase, brand, links and image requirements |
| `.ai/artifacts/` | Temporary working documents (current/ and archive/) |
| `arc42/` | Architecture documentation and ADRs |
| `.github/` | Issue and PR templates |
| `scripts/` | GitHub project setup automation |
| `files/` | Original founder briefs (marketing site + workflow prompts) |
| `screenshots/` | Approved design concepts (marketing page + app UI) |

## Keep documentation alive

Whenever a task reveals a reusable lesson, put it in the right home: `CLAUDE.md` (critical universal rule), `.ai/skills/` (stack knowledge), `.ai/workflows/` (process), `.ai/quality-gates/` (repeatable checks), `arc42/` (architecture/decisions), `.ai/context/` (product and brand). Do not leave important knowledge only in chat. Stale documentation is a defect.
