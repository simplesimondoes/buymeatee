#!/usr/bin/env bash
#
# setup-github-project.sh — create BuyMeATee labels, milestones and the initial backlog.
#
# Requirements:
#   - GitHub CLI (`gh`) installed and authenticated: `gh auth login`
#     (needs `repo` scope on the target repository)
#   - Run from anywhere; the target repository is fixed below.
#
# Safety:
#   - Safe to rerun. Labels are created-or-updated; milestones and issues are
#     skipped if one with the same title already exists (issues: open OR closed,
#     so reruns never resurrect finished work).
#   - Contains no tokens. Stops on the first meaningful error (set -e).
#
set -euo pipefail

REPO="simplesimondoes/buymeatee"

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: GitHub CLI (gh) is not installed. See https://cli.github.com" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "ERROR: gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

if ! gh repo view "$REPO" >/dev/null 2>&1; then
  echo "ERROR: cannot access $REPO with the current authentication." >&2
  exit 1
fi

echo "==> Target repository: $REPO"

# ---------------------------------------------------------------------------
# Labels (create-or-update; --force makes this idempotent)
# ---------------------------------------------------------------------------
echo "==> Labels"

label() { # name color description
  gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null
  echo "    label: $1"
}

# Type
label "type:feature"      "1D76DB" "New capability or page"
label "type:bug"          "D73A4A" "Something is broken"
label "type:enhancement"  "A2EEEF" "Improvement to something that exists"
label "type:research"     "D4C5F9" "Discovery work answering an open question"
label "type:content"      "0E8A16" "Copy, articles, editorial"
label "type:architecture" "5319E7" "Major technical decision (needs ADR)"

# Area
label "area:marketing"     "FBCA04" "Marketing website"
label "area:seo"           "C2E0C6" "Search visibility, metadata, structured data"
label "area:content"       "BFD4F2" "Content and editorial"
label "area:design-system" "F9D0C4" "Tokens and shared components"
label "area:creator"       "006B75" "Creator-side experience"
label "area:supporter"     "0052CC" "Supporter-side experience"
label "area:payments"      "B60205" "Payments and payouts (future)"
label "area:platform"      "555555" "Infrastructure, deployment, tooling"
label "area:legal"         "E4E669" "Legal, privacy, terms"
label "area:analytics"     "C5DEF5" "Measurement and events"

# Priority
label "priority:critical" "B60205" "Drop everything"
label "priority:high"     "D93F0B" "Next up"
label "priority:medium"   "FBCA04" "Normal queue"
label "priority:low"      "C2E0C6" "When convenient"

# Status
label "status:needs-discovery" "D4C5F9" "Open questions before it is buildable"
label "status:ready"           "0E8A16" "Scoped and buildable"
label "status:blocked"         "B60205" "Waiting on something"
label "status:in-review"       "FBCA04" "Built, awaiting review/release"

# Source
label "source:founder"       "EDEDED" "Founder direction"
label "source:user-research" "EDEDED" "From creator/supporter research"
label "source:analytics"     "EDEDED" "From measured behaviour"
label "source:seo"           "EDEDED" "From search data"
label "source:support"       "EDEDED" "From user support"

# ---------------------------------------------------------------------------
# Milestones (skip if title exists)
# ---------------------------------------------------------------------------
echo "==> Milestones"

EXISTING_MILESTONES=$(gh api "repos/$REPO/milestones?state=all&per_page=100" --jq '.[].title')

milestone() { # title description
  if printf '%s\n' "$EXISTING_MILESTONES" | grep -Fxq "$1"; then
    echo "    milestone exists: $1"
  else
    gh api "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null
    echo "    milestone created: $1"
  fi
}

milestone "Marketing Wave 1 — Foundation" \
  "Project setup, design system, homepage, navigation and footer, deployment foundation."
milestone "Marketing Wave 2 — Audiences" \
  "For creators, for supporters, how it works, about, FAQ."
milestone "Marketing Wave 3 — SEO and content" \
  "Technical SEO, blog architecture, launch articles, internal linking, structured data."
milestone "Marketing Wave 4 — Early access" \
  "Creator-interest form, supporter-interest form, form integration, privacy alignment, analytics events."
milestone "Marketing Wave 5 — Launch polish" \
  "Responsive review, accessibility review, performance review, production content, final imagery, legal review, domain launch."
milestone "Product Discovery" \
  "Creator interviews, supporter interviews, payment and payout research, prototype testing, pricing research."

# ---------------------------------------------------------------------------
# Backlog issues (skip if an issue with the same title exists, open or closed)
# ---------------------------------------------------------------------------
echo "==> Backlog issues"

EXISTING_ISSUES=$(gh issue list --repo "$REPO" --state all --limit 500 --json title --jq '.[].title')

issue() { # title milestone labels body
  if printf '%s\n' "$EXISTING_ISSUES" | grep -Fxq "$1"; then
    echo "    issue exists: $1"
  else
    gh issue create --repo "$REPO" --title "$1" --milestone "$2" --label "$3" --body "$4" >/dev/null
    echo "    issue created: $1"
  fi
}

SEAM_NOTE="## Seam map

_To be added once the implementation exists — do not guess file paths before inspecting the code. Likely files / components to reuse / new components needed / verification path._"

issue "Establish project foundation and design tokens" \
  "Marketing Wave 1 — Foundation" \
  "type:feature,area:platform,area:design-system,priority:high,status:ready,source:founder" \
"## Problem
No code exists. Every later issue depends on a scaffolded project with the brand's design foundations in place.

## Scope
- Scaffold Next.js App Router + TypeScript (strict) + Tailwind per \`.ai/skills/nextjs-typescript.md\` (ADR-001/002).
- Design tokens from \`.ai/context/brand.md\` and \`.ai/skills/design-system.md\`: palette, editorial serif + sans via next/font, spacing, radius.
- ESLint, test runner setup, \`npm run lint|test|build\` working.
- \`.env.example\` with NEXT_PUBLIC_SITE_URL and EARLY_ACCESS_API_URL placeholders.
- Root layout, error/not-found boundaries, favicon + initial logo mark (SVG).
- Update CLAUDE.md technology/verification sections and the affected skills to describe reality.

## Non-goals
Page content beyond a minimal placeholder; forms; blog; analytics.

## Acceptance criteria
- [ ] npm install && npm run lint && npm run test && npm run build all pass
- [ ] Tokens centralised; no raw hex in components
- [ ] CLAUDE.md and skills updated from 'planned' to actual

## Verification plan
Run all commands; load the dev server; confirm fonts/tokens render; check 375/768/1024/1440.

$SEAM_NOTE"

issue "Build responsive global navigation and footer" \
  "Marketing Wave 1 — Foundation" \
  "type:feature,area:marketing,area:design-system,priority:high,status:ready,source:founder" \
"## Problem
Every page needs the shared shell: header navigation and footer.

## Scope
- Header: How it works, For creators, For supporters, Blog, FAQ; primary CTA 'Start your page'; secondary 'Join early access'. No functional login (omit or mark 'Coming soon' — no dead actions).
- Accessible mobile menu (keyboard, focus management, escape).
- Footer: brand summary, product/company/legal links, dynamic copyright year, buymeatee.com. No dead social icons.
- Centralised navigation/footer link data (typed).

## Non-goals
Page content; blog; forms.

## Acceptance criteria
- [ ] Keyboard-only operation of header + mobile menu
- [ ] Header blends into hero and stays readable
- [ ] Passes accessibility checklist items for menus

## Verification plan
Exercise navigation at 375/768/1024/1440; keyboard-only pass; screenshots to .ai/artifacts/current/.

$SEAM_NOTE"

issue "Build homepage hero and proposition sections" \
  "Marketing Wave 1 — Foundation" \
  "type:feature,area:marketing,priority:high,status:ready,source:founder" \
"## Problem
The homepage must land the proposition: Support the journey.

## Scope
- Hero: heading 'Support the journey.', approved body copy, CTAs 'Find golf creators' (scrolls to supporter early access / coming-soon explanation) and 'Start your page' (scrolls to creator early access). Authentic golf imagery. NO fake trust signals (the concept image's ratings/avatars are explicitly not reproduced — ADR-007).
- 'How it works' section: 'Simple. Transparent. Golf.' + three steps (creators share goals / fans buy a tee / the journey continues) + 'See how it works' CTA.
- 'More than just a tip jar' section with the four features; security phrased as a design principle, no provider claims.
- Final CTA section.

## Non-goals
Audience panels, support options, example goals (separate issues); early-access form (Wave 4 — CTAs may anchor to a placeholder section honestly).

## Acceptance criteria
- [ ] Copy matches the brief and content checklist (British English, approved CTAs)
- [ ] Server rendered; unique metadata
- [ ] Intentional layout at all four viewports

## Verification plan
Full journey scroll at 375/768/1024/1440; content + SEO checklists; screenshots.

$SEAM_NOTE"

issue "Build creator and supporter audience panels" \
  "Marketing Wave 2 — Audiences" \
  "type:feature,area:marketing,area:creator,area:supporter,priority:high,status:ready,source:founder" \
"## Problem
The homepage must speak to both sides of the marketplace distinctly.

## Scope
- 'For golf creators' panel: 'Turn followers into part of the journey.' + five points + 'Start your page' CTA + polished fictional creator card labelled 'Example' (Alex Morgan, 7.8 handicap, Road to Scratch, £640 of £1,200, 53%).
- 'For golf fans' panel: 'Support the golfers you believe in.' + five points + 'Join as a supporter' CTA + supporter collection/journey preview inspired by the app concept, labelled 'Preview'.

## Non-goals
Dedicated /for-creators and /for-supporters pages (separate issues).

## Acceptance criteria
- [ ] All fictional content visibly labelled Example/Preview
- [ ] Panels stack intentionally on mobile
- [ ] Progress bar accessible (text values, not colour-only)

## Verification plan
Responsive pass; content checklist; screenshots.

$SEAM_NOTE"

issue "Build support-option and example-goal previews" \
  "Marketing Wave 2 — Audiences" \
  "type:feature,area:marketing,priority:medium,status:ready,source:founder" \
"## Problem
Visitors need to see the golf-native support mechanic and what goals look like.

## Scope
- Support options: 1 Tee, 3 Tees, 9 Holes, 18 Holes, Green Fee, Custom Support — illustrative only, with copy that creators will be able to customise options. No checkout.
- Six example goal cards (Scotland Links Trip, Road to Scratch, Amateur Championship Entry, Independent Course Reviews, First Professional Season, Women's Golf Content Series): image, fictional creator name, description, progress bar, amount/target, preview CTA. Every card labelled Example/Concept.
- Typed data for options and sample goals, centralised.

## Non-goals
Any payment behaviour; real creator data.

## Acceptance criteria
- [ ] Illustrative framing is explicit; no implication payments are live
- [ ] Cards labelled; grid responsive at all four viewports

## Verification plan
Responsive pass; content checklist; screenshots.

$SEAM_NOTE"

issue "Build For Creators page" \
  "Marketing Wave 2 — Audiences" \
  "type:feature,area:marketing,area:creator,priority:high,status:ready,source:founder" \
"## Problem
Creator prospects need a page that speaks to them directly (/for-creators).

## Scope
Who it's for (incl. YouTube/TikTok/Instagram creators, amateur competitors, aspiring pros, coaches, reviewers, travel/women's/adaptive creators, juniors via parent or guardian), goal-based support explanation, example goals, benefits, planned creator workflow (marked as planned), early-access CTA. Must state that accounts involving minors require an appropriate parent or guardian; never imply minors contract independently. Feels right for small/emerging creators.

## Non-goals
Creator onboarding, accounts, dashboards.

## Acceptance criteria
- [ ] Unique metadata + canonical; server rendered
- [ ] Planned features clearly marked as planned
- [ ] Content + SEO checklists pass

## Verification plan
Responsive pass; checklists; internal links to/from homepage and how-it-works.

$SEAM_NOTE"

issue "Build For Supporters page" \
  "Marketing Wave 2 — Audiences" \
  "type:feature,area:marketing,area:supporter,priority:high,status:ready,source:founder" \
"## Problem
Supporter prospects need a page that speaks to them directly (/for-supporters).

## Scope
How supporters discover golfers, choosing a goal, what buying a tee means, planned progress updates, future badges and collections (marked as planned), and a clear statement that support is not investment, ownership or guaranteed content.

## Non-goals
Accounts, payment flows, real discovery.

## Acceptance criteria
- [ ] Support-vs-purchase distinction is explicit
- [ ] Unique metadata + canonical; checklists pass

## Verification plan
Responsive pass; content + SEO checklists.

$SEAM_NOTE"

issue "Build How It Works page" \
  "Marketing Wave 2 — Audiences" \
  "type:feature,area:marketing,priority:high,status:ready,source:founder" \
"## Problem
Both audiences need the end-to-end picture (/how-it-works).

## Scope
Creator journey (create a page → share your story → add a goal → share your link → receive support → post updates) and supporter journey (discover → choose a goal → buy a tee → leave a message → follow progress → celebrate milestones). Unreleased functions clearly marked as planned.

## Non-goals
Implementing any of the journeys.

## Acceptance criteria
- [ ] Both journeys presented; planned features marked
- [ ] Unique metadata; checklists pass

## Verification plan
Responsive pass; content + SEO checklists.

$SEAM_NOTE"

issue "Build FAQ and About pages" \
  "Marketing Wave 2 — Audiences" \
  "type:feature,area:marketing,area:content,priority:medium,status:ready,source:founder" \
"## Problem
Trust questions need honest answers (/faq), and the brand needs a story (/about).

## Scope
- /faq: crawlable groups — General, For creators, For supporters, Payments and fees, Safety and trust, Launch and availability. No invented fees or dates; payment answers say final details will be published transparently before launch. FAQ structured data only for visible matching content. Accessible accordion.
- /about: the approved story ('A coffee is quickly forgotten; a tee… creates a story'). No invented team, funding, HQ, history or partnerships.
- Homepage FAQ preview section (six approved questions) linking to /faq.

## Acceptance criteria
- [ ] FAQ keyboard accessible; structured data matches visible content
- [ ] About contains zero invented facts
- [ ] Checklists pass

## Verification plan
Responsive pass; structured-data validation; content checklist.

$SEAM_NOTE"

issue "Implement technical SEO foundation" \
  "Marketing Wave 3 — SEO and content" \
  "type:feature,area:seo,area:platform,priority:high,status:ready,source:founder" \
"## Problem
SEO is a first-class requirement and needs shared infrastructure, not per-page improvisation.

## Scope
Central metadata utilities (title template '%s | BuyMeATee', default title, canonical origin from NEXT_PUBLIC_SITE_URL), Open Graph + Twitter cards + default share image, dynamic sitemap, robots.txt, web manifest + icons, breadcrumbs + breadcrumb structured data on internal pages, WebSite/Organisation structured data only where factually appropriate. See .ai/skills/seo.md.

## Non-goals
Blog (next issue); content rewrites.

## Acceptance criteria
- [ ] Every existing route: unique title/description/canonical, valid OG
- [ ] Sitemap and robots correct; no accidental noindex
- [ ] SEO checklist passes on all routes

## Verification plan
Inspect rendered metadata per route; validate structured data; check sitemap output.

$SEAM_NOTE"

issue "Create blog architecture" \
  "Marketing Wave 3 — SEO and content" \
  "type:feature,area:content,area:seo,priority:high,status:ready,source:founder" \
"## Problem
Launch articles need an SEO-ready local content architecture (ADR-003: no CMS).

## Scope
MDX or typed structured content in-repo; article model (title, slug, description, author 'BuyMeATee Editorial', publication/updated dates, reading time, hero image, body, internal links); /blog index + /blog/[slug]; Article structured data; blog entries in the sitemap; BlogCard component; documented add-an-article process in .ai/skills/content.md.

## Non-goals
The articles themselves (next issue); CMS; comments; RSS unless trivial.

## Acceptance criteria
- [ ] Adding an article is a documented, single-place change
- [ ] Article pages pass the SEO checklist

## Verification plan
Render a sample article; validate structured data; check sitemap inclusion.

$SEAM_NOTE"

issue "Publish four launch articles" \
  "Marketing Wave 3 — SEO and content" \
  "type:content,area:content,area:seo,priority:medium,status:ready,source:founder" \
"## Problem
The blog needs genuinely useful launch content targeting distinct search intents.

## Scope
Per the brief (files/buymeatee-marketing-site-prompt.md), 900–1,500 words each, internally linked to product pages:
1. /blog/how-to-support-a-golf-content-creator — How to Support a Golf Content Creator
2. /blog/how-golf-creators-can-fund-their-content — How Golf Creators Can Fund Better Content
3. /blog/golf-sponsorship-for-amateur-players — Golf Sponsorship for Amateur Players: A Practical Guide (no amateur-status rulings; rules vary and must be checked)
4. /blog/what-does-it-cost-to-create-golf-content — What Does It Cost to Create Golf Content? (no invented universal averages)

## Acceptance criteria
- [ ] No AI filler, keyword stuffing or unsupported statistics
- [ ] Each article passes content + SEO checklists
- [ ] Natural internal links both directions

## Verification plan
Content-and-seo workflow per article; mobile typography check.

$SEAM_NOTE"

issue "Implement early-access registration interface" \
  "Marketing Wave 4 — Early access" \
  "type:feature,area:marketing,area:creator,area:supporter,priority:high,status:ready,source:founder" \
"## Problem
The site's key conversion: creators and supporters registering interest.

## Scope
Two selectable routes ('I'm a golf creator' / 'I'm a supporter'); fields: name, email, role, country, optional profile/social link, optional 'What would you use BuyMeATee for?'; consent text + privacy link; client validation; loading/success/error states. Accessible labels and error association. See .ai/skills/forms.md.

## Non-goals
The actual submission service connection (next issue) — but the UI must integrate with the service boundary contract, and with no endpoint configured must show the honest fallback, never fake success.

## Acceptance criteria
- [ ] All states reachable and honest; keyboard + screen-reader friendly
- [ ] Minimal data collection; consent text matches reality

## Verification plan
Exercise both routes, all states, at all four viewports; accessibility + security checklists.

$SEAM_NOTE"

issue "Connect and validate form submission service" \
  "Marketing Wave 4 — Early access" \
  "type:feature,area:platform,priority:high,status:needs-discovery,source:founder" \
"## Problem
Submissions need to land somewhere real. No provider is selected yet (ADR-004 defines the boundary; provider choice pending).

## Scope
- Choose the provider (Formspree/Loops/ConvertKit/Supabase/other) — record as an ADR if it implies persistence or architecture.
- Server-side validation at the boundary; EARLY_ACCESS_API_URL wiring; spam resistance (honeypot, basic rate limiting); no sensitive logging.
- Document configuration in .ai/skills/forms.md and .ai/skills/operations.md; update .env.example.
- Verify end-to-end with a real test submission.

## Acceptance criteria
- [ ] Real submission arrives at the provider; failure states honest
- [ ] No secrets client-side; security checklist passes

## Verification plan
End-to-end test submission (success + forced failure); check provider dashboard; confirm nothing sensitive in logs.

$SEAM_NOTE"

issue "Add privacy and terms drafts" \
  "Marketing Wave 4 — Early access" \
  "type:content,area:legal,priority:high,status:ready,source:founder" \
"## Problem
The early-access form collects personal data; /privacy and /terms must exist and describe reality.

## Scope
- /privacy: accurate pre-launch draft reflecting what the site actually collects (early-access fields, chosen provider as processor). No fictional processors.
- /terms: sensible pre-launch draft.
- Both clearly marked as drafts for legal review, not legal advice.
- Consent text on the form aligned with the privacy draft.

## Acceptance criteria
- [ ] Privacy matches the real form fields and provider
- [ ] Legal-review markers visible; security & privacy checklist passes

## Verification plan
Cross-check privacy text against the implemented form and provider config.

$SEAM_NOTE"

issue "Complete accessibility and responsive audit" \
  "Marketing Wave 5 — Launch polish" \
  "type:enhancement,area:marketing,priority:high,status:ready,source:founder" \
"## Problem
Pre-launch, the whole site needs a systematic accessibility and responsive pass — not per-feature spot checks.

## Scope
Full .ai/quality-gates/accessibility-checklist.md pass on every route; keyboard-only walkthrough; contrast verification of the cream/green/gold pairings; 375/768/1024/1440 review of every page; fix findings or file issues for anything deferred.

## Acceptance criteria
- [ ] Audit report in .ai/artifacts/current/ with findings + resolutions
- [ ] Lighthouse Accessibility ≥ 95 on key pages (arc42/10)

## Verification plan
Documented audit with screenshots per viewport.

$SEAM_NOTE"

issue "Complete performance and SEO audit" \
  "Marketing Wave 5 — Launch polish" \
  "type:enhancement,area:seo,area:platform,priority:high,status:ready,source:founder" \
"## Problem
Launch requires verified performance and search-readiness, not assumed.

## Scope
Lighthouse runs on key pages against arc42/10 targets (Performance ≥ 90 mobile, SEO ≥ 95, CLS < 0.1); image/format optimisation; full SEO checklist across routes; structured-data validation; internal-link and duplicate-intent review; fix or file findings.

## Acceptance criteria
- [ ] Audit report in .ai/artifacts/current/ with scores and resolutions
- [ ] arc42/10 targets met or consciously waived with reasons

## Verification plan
Documented Lighthouse results before/after fixes.

$SEAM_NOTE"

issue "Prepare production launch" \
  "Marketing Wave 5 — Launch polish" \
  "type:feature,area:platform,area:legal,priority:critical,status:blocked,source:founder" \
"## Problem
Everything must come together for buymeatee.com to go live.

## Scope
- Production content pass: replace placeholder imagery per the image requirements document (licensed/original only); final copy review.
- Legal review of privacy/terms drafts (external — founder to arrange).
- Vercel production configuration: domain, environment variables, analytics decision.
- Full release checklist (.ai/quality-gates/release-checklist.md); update arc42/07 with real deployment facts.

## Non-goals
New features.

## Dependencies
All prior waves; legal review is an external blocker (status:blocked until arranged).

## Acceptance criteria
- [ ] Release checklist passes end to end
- [ ] buymeatee.com serves the site with verified metadata and working form

## Verification plan
Post-deploy verification of the live domain: key journeys, form submission, metadata, no console errors.

$SEAM_NOTE"

echo "==> Done. Review at: https://github.com/$REPO/issues"
