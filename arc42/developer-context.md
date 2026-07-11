# Developer Context (compact orientation)

**Product.** BuyMeATee — golf-focused creator-support platform. Golf fans support creators/aspiring pros/coaches/reviewers towards real goals. Proposition: *Support the journey.* Golf-native units (tee, holes, round, green fee). Never a donation/tipping/crowdfunding feel. British English, premium editorial golf brand, exact spelling **BuyMeATee**.

**Phase.** Marketing website + early-access validation. **No code exists yet** (as of July 2026). No auth, DB, payments, dashboards. Full app only via future issues + ADRs.

**Stack (decided, pending implementation).** Next.js App Router, TypeScript, Tailwind, Vercel, server-rendered public pages, local MDX/typed blog content, isolated early-access form boundary (`EARLY_ACCESS_API_URL`). Domain: buymeatee.com.

**Core rules.** Honest pre-launch content (fiction labelled Example/Preview/Concept; no fake stats/users/claims). No secrets client-side. SEO and accessibility are part of done. Responsive at 375/768/1024/1440. Reuse before creating. ADRs for meaningful decisions. **Pause before commit/push/deploy until the user says `Release`.**

**Repository map.** `CLAUDE.md` (entry point) · `.ai/agents|skills|workflows|quality-gates|context|artifacts` · `arc42/` (this documentation; ADRs in `09-adrs.md`) · `.github/` (templates) · `scripts/setup-github-project.sh` · `files/` (founder briefs) · `screenshots/` (approved design concepts).

**Verification.** Nothing runnable yet. After scaffold: `npm run lint && npm run test && npm run build`, plus manual journey + responsive checks. Never claim gates passed that didn't run.

**Key decisions.** ADR-001 Next.js App Router · ADR-002 server-render by default · ADR-003 local content before CMS · ADR-004 form service boundary · ADR-005 no DB/auth/payments during validation · ADR-006 design tokens + reusable components · ADR-007 label fictional examples.

**Known risks.** Two-sided cold start, unvalidated demand, future payments/payouts/KYC/minors/moderation complexity, spam submissions, draft legal copy, placeholder imagery, and planned-vs-actual documentation drift once building starts. Details: [11-risks-and-technical-debt.md](11-risks-and-technical-debt.md).
