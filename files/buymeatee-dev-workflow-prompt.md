# BuyMeATee — Introduce the Repository-Based Development Workflow

You are working in this repository:

- HTTPS: `https://github.com/simplesimondoes/buymeatee.git`
- SSH: `git@github.com:simplesimondoes/buymeatee.git`
- Production domain: `https://buymeatee.com`

Your task is to introduce a durable, repository-based AI development workflow for BuyMeATee.

The goal is that future Claude Code sessions begin with enough product, technical, architectural and delivery context to work effectively without the owner repeatedly explaining the project.

The repository should become the long-term memory of the product.

Do not copy assumptions, technology decisions, commands or architecture from another codebase unless they are genuinely applicable to BuyMeATee.

---

## Core operating principle

Project knowledge must live in the repository rather than only in chat history.

Store:

- Product intent
- Product terminology
- Current delivery phase
- Technical conventions
- Architecture
- Important decisions
- Known risks
- Working agreements
- Reusable workflows
- Quality expectations
- Verification commands
- Current waves and backlog

The intended result is that future prompts can be short, for example:

> Start Marketing Wave 1. Read the linked issues and repository context. Build, verify and pause for release.

That should be enough because the project detail already lives in the repository.

---

## Release-control rule

Claude must not automatically commit, merge, push or deploy completed work unless the user explicitly says:

> Release

The default workflow is:

1. Scope
2. Inspect
3. Build
4. Review
5. Verify
6. Report
7. Pause
8. Wait for the explicit release instruction

If the user explicitly instructs Claude to commit, push or deploy as part of a particular task, that instruction overrides the default pause rule for that task.

State this rule clearly in `CLAUDE.md` and the release workflow.

---

# 1. Create the workflow structure

Create:

```text
CLAUDE.md
.ai/
├── agents/
├── skills/
├── workflows/
├── quality-gates/
├── context/
└── artifacts/
arc42/
.github/
├── ISSUE_TEMPLATE/
└── pull_request_template.md
scripts/
```

Use concise, useful Markdown files rather than generic boilerplate.

---

# 2. Create `CLAUDE.md`

Create a root-level `CLAUDE.md`.

This is the primary entry point for future Claude Code sessions.

Keep it concise and point to more detailed files elsewhere.

Include the following sections.

## Product

BuyMeATee is a golf-focused creator-support platform.

It helps golf fans support creators, aspiring professionals, amateur competitors, coaches, course reviewers and other golfers as they pursue meaningful goals.

The core proposition is:

> Support the journey.

The product must feel like participation in a golfer's journey rather than a generic donation platform.

## Current phase

The current phase is:

> Marketing website and product validation.

Do not build the full application, payments, creator dashboard, supporter dashboard or authentication unless a future issue explicitly introduces them.

## Current technology

Initially document the real implementation, expected to include:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Vercel
- Server-rendered or statically generated public pages
- Local structured content or MDX
- No production database unless explicitly introduced
- No payment provider selected yet
- No authentication provider selected yet

Update this section when the implementation changes.

## Product vocabulary

Use these terms consistently:

- BuyMeATee
- Creator
- Supporter
- Goal
- Journey
- Buy a tee
- Support a round
- Green fee
- Early access

Avoid:

- Donation
- Recipient
- Begging
- Crowdfunding campaign
- Influencer-only wording

## Hard rules

Include:

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
- Record meaningful architectural decisions in `arc42/09-adrs.md`.
- Pause before release unless explicitly instructed otherwise.

## Verification commands

Document only commands that genuinely exist.

Expected commands:

```bash
npm install
npm run lint
npm run test
npm run build
```

If tests are not yet configured, either add them or document the actual verification process honestly.

Visual changes must also be verified at:

- 375px
- 768px
- 1024px
- 1440px

## Repository map

Point to:

- `.ai/agents/`
- `.ai/skills/`
- `.ai/workflows/`
- `.ai/quality-gates/`
- `.ai/context/`
- `.ai/artifacts/`
- `arc42/`
- Blog content
- Shared marketing components
- Form integration
- SEO utilities

---

# 3. Create agents

Create short, opinionated files under `.ai/agents/`.

Each file should explain:

- When to wear the role
- Main responsibilities
- Questions to ask
- Checks to perform
- Common mistakes to avoid

Create:

## `.ai/agents/product-manager.md`

Use for:

- Scoping features
- Defining waves
- Writing issues
- Separating validation from premature implementation
- Protecting the core proposition

It should ask:

- What user problem does this solve?
- Is this for creators, supporters or both?
- Does this help validate demand?
- Is it necessary in the current wave?
- Are we building infrastructure before proving the need?

## `.ai/agents/frontend-dev.md`

Use for:

- Next.js
- React
- TypeScript
- Tailwind
- Responsive UI
- Components
- Forms
- Marketing pages

Priorities:

- Server components by default
- Client components only where interaction requires them
- Reuse before duplication
- Semantic HTML
- Minimal client-side JavaScript
- Accurate responsive behaviour
- No generic SaaS styling that weakens the brand

## `.ai/agents/seo-editor.md`

Use for:

- Metadata
- Sitemap
- Robots
- Canonicals
- Structured data
- Internal linking
- Blog architecture
- Search intent

Guard against:

- Keyword stuffing
- Thin articles
- Unsupported statistics
- Duplicate page intent
- Client-only important content
- Structured data that does not match visible content

## `.ai/agents/content-designer.md`

Use for:

- Marketing copy
- Product terminology
- Information hierarchy
- CTAs
- FAQs
- Empty states
- Error states

Tone:

- Warm
- Aspirational
- Golf-literate
- British English
- Premium but approachable
- Honest about the pre-launch state

## `.ai/agents/designer.md`

Use for:

- Brand consistency
- Design tokens
- Layout
- Type hierarchy
- Image direction
- Mobile behaviour
- Interaction polish

Preserve the approved premium editorial golf aesthetic.

## `.ai/agents/architect.md`

Use before:

- Adding a database
- Adding authentication
- Selecting payment architecture
- Introducing a monorepo
- Creating major modules
- Changing deployment architecture
- Building creator or supporter applications

Consult `arc42/` and create or update an ADR for meaningful long-term decisions.

## `.ai/agents/backend-dev.md`

Initially keep this lightweight.

Use when:

- Connecting early-access submissions
- Adding server actions or route handlers
- Introducing persistence
- Adding webhooks
- Building future creator or supporter services

Do not assume Supabase, Firebase or another backend until selected through an ADR.

## `.ai/agents/security.md`

Use before work involving:

- Personal data
- Forms
- Authentication
- Payments
- API keys
- Webhooks
- Creator payouts
- Account access
- Moderation
- Minors

Checks:

- Secrets stay server-side
- Inputs are validated
- Personal-data collection is minimised
- Errors do not leak sensitive detail
- Payment claims match reality
- Minor-related flows account for a parent or guardian
- Future payouts account for identity verification and platform risk

## `.ai/agents/test-engineer.md`

Prioritise tests for:

- Form validation
- Content parsing
- Metadata generation
- Navigation
- Mobile menu
- FAQ interaction
- Payment calculations in the future
- Permissions and payout flows in the future

Avoid brittle tests for static presentation without clear value.

## `.ai/agents/reviewer.md`

Review for:

- Correctness
- Simplicity
- Reuse
- Product honesty
- Accessibility
- Responsive behaviour
- SEO
- Missing edge cases
- Unnecessary dependencies
- Scope expansion

## `.ai/agents/documentation.md`

Ensure:

- `CLAUDE.md` remains current
- Skills reflect the actual stack
- Arc42 reflects the actual architecture
- ADRs reflect changed decisions
- README commands still work
- Stale documentation is corrected or removed

---

# 4. Create skills

Create files under `.ai/skills/`.

Skills must explain how each part of this project actually works, not provide generic tutorials.

Create:

## `.ai/skills/nextjs-typescript.md`

Document:

- App Router conventions
- Server versus client components
- Route structure
- Shared layouts
- Metadata handling
- TypeScript expectations
- Import conventions
- Error and loading boundaries
- Rules for adding dependencies

## `.ai/skills/design-system.md`

Document:

- Brand colours
- Typography
- Spacing
- Radius
- Shadows
- Buttons
- Cards
- Progress bars
- Section rhythm
- Responsive rules
- Logo usage
- Image treatment
- Contrast expectations

## `.ai/skills/seo.md`

Document:

- Metadata
- Canonicals
- Open Graph
- Structured data
- Sitemap
- Robots
- Breadcrumbs
- Article metadata
- Internal links
- Title conventions
- Utility locations

## `.ai/skills/content.md`

Document:

- Brand terminology
- Tone of voice
- British English
- How to label fictional examples
- Claims that must not be made
- Blog author conventions
- Content storage
- How to add an article
- Content-review expectations

## `.ai/skills/forms.md`

Document:

- Early-access form structure
- Validation
- Submission service
- Environment configuration
- Success and error states
- Consent handling
- Personal-data minimisation
- Future backend connection points

## `.ai/skills/testing.md`

Document:

- Test runner
- Test locations
- What deserves testing
- Commands
- Visual verification
- Accessibility checks
- How to distinguish existing failures from new failures

## `.ai/skills/operations.md`

Document:

- Node version
- Package manager
- Local setup
- Vercel deployment
- Environment variables
- Preview expectations
- Production-domain configuration
- Release verification
- Rollback notes when known

## `.ai/skills/architecture.md`

Point into the relevant `arc42/` chapters.

Explain:

- Current system shape
- Current constraints
- Where future application decisions belong
- The requirement to create ADRs for important decisions

## `.ai/skills/github-issues.md`

Document:

- Labels
- Milestones
- Issue templates
- Seam mapping
- Branch naming
- PR closing syntax
- Release pause
- Reproducible issue creation

---

# 5. Create workflows

Create:

## `.ai/workflows/wave.md`

This is the default workflow.

Steps:

1. **Read**
   - Read `CLAUDE.md`.
   - Read the relevant issues.
   - Read the relevant skills and arc42 chapters.

2. **Scope**
   - Confirm the wave's single theme.
   - Identify exclusions.
   - Defer unrelated improvements.

3. **Inspect**
   - Find existing implementation seams.
   - Identify reuse versus new construction.
   - Note likely files.
   - Identify risks before coding.

4. **Build**
   - Implement the smallest coherent solution.
   - Reuse existing components and utilities.
   - Update tests and documentation where appropriate.

5. **Review**
   - Wear the reviewer role.
   - Run matching specialist reviews such as security, SEO or content.

6. **Verify**
   - Run the implementation.
   - Exercise the relevant journey.
   - Check responsive states.
   - Capture screenshots for visual work where practical.

7. **Gates**
   - Run lint.
   - Run tests.
   - Run production build.
   - Complete matching checklists.

8. **Report**
   - Explain what changed.
   - Explain what was verified.
   - List unresolved risks or follow-up work.

9. **Pause**
   - Do not commit or deploy.
   - Wait for the explicit instruction: `Release`.

## `.ai/workflows/bugfix.md`

Steps:

1. Reproduce the issue.
2. Identify the cause before changing code.
3. Check whether the same pattern exists elsewhere.
4. Implement the smallest safe correction.
5. Add a regression test where valuable.
6. Verify the original reproduction path.
7. Run relevant gates.
8. Report and pause for release.

Do not hide an underlying bug with a visual workaround.

## `.ai/workflows/content-and-seo.md`

Steps:

1. Define search intent and reader.
2. Confirm the page does not duplicate another page's purpose.
3. Draft useful content without keyword stuffing.
4. Add metadata and internal links.
5. Add valid structured data where appropriate.
6. Review claims and factual accuracy.
7. Check headings, snippets and mobile presentation.
8. Run SEO and content gates.
9. Report and pause.

## `.ai/workflows/architecture-change.md`

Use before major technical changes.

Steps:

1. Define the problem.
2. Describe current constraints.
3. List realistic options.
4. Compare trade-offs.
5. Recommend one option.
6. Record the decision in an ADR.
7. Update affected arc42 chapters.
8. Only then implement the approved change.

Use for:

- Authentication
- Database
- Payments
- Creator payouts
- Media storage
- Moderation
- Native apps
- Public creator discovery
- Major analytics decisions

## `.ai/workflows/release.md`

Triggered only by explicit user instruction.

Steps:

1. Confirm agreed scope.
2. Confirm no critical unresolved issue remains.
3. Run the full release gate.
4. Update documentation.
5. Create an appropriate branch if needed.
6. Commit with a clear message.
7. Push only if authorised.
8. Open or update a pull request if requested.
9. Include `Closes #...` for completed issues.
10. Report deployment status honestly.

Never claim deployment unless verified.

## `.ai/workflows/discovery.md`

Steps:

1. State the unknown.
2. Inspect current implementation and evidence.
3. Research or prototype only as much as needed.
4. Record findings.
5. Recommend a direction.
6. Do not silently turn discovery into full implementation.
7. Pause for a product decision.

---

# 6. Create quality gates

Create:

## `.ai/quality-gates/review-checklist.md`

Include:

- Work matches requested scope.
- Edge cases were considered.
- Existing components and utilities were reused where appropriate.
- No unnecessary dependency was added.
- No fake product claim was introduced.
- No placeholder appears as finished functionality.
- Type safety is preserved.
- No obvious console or hydration error remains.
- Documentation was updated where needed.
- The implementation was verified, not merely compiled.

## `.ai/quality-gates/seo-checklist.md`

Include:

- Unique page title
- Accurate meta description
- Canonical URL
- Correct indexability
- One clear H1
- Logical heading hierarchy
- Server-rendered important content
- Internal links
- Descriptive alt text
- Structured data matches visible content
- Sitemap inclusion
- No duplicate intent
- No keyword stuffing
- Valid Open Graph output

## `.ai/quality-gates/accessibility-checklist.md`

Include:

- Keyboard operation
- Visible focus
- Semantic landmarks
- Correct form labels
- Useful validation messages
- Sufficient contrast
- Mobile touch targets
- Reduced-motion support
- Accessible dialogs and menus
- Appropriate alt treatment
- No information relies only on colour

## `.ai/quality-gates/security-and-privacy-checklist.md`

Include:

- No secrets in client code or source control
- Inputs are validated
- Data collection is minimised
- Consent text matches actual use
- Privacy documentation reflects reality
- Sensitive data is not written to logs
- Errors do not leak implementation detail
- Minor-related flows are considered
- Payment or payout changes receive dedicated review
- Dependencies do not introduce obvious risk

## `.ai/quality-gates/content-checklist.md`

Include:

- BuyMeATee spelling is consistent
- British English is used
- Tone matches the brand
- Fictional examples are labelled
- Claims are supported
- No invented statistics
- No fake testimonials
- No premature feature promises
- CTA language is clear
- The reader and next action are obvious

## `.ai/quality-gates/testing-checklist.md`

Include:

- Existing tests pass
- Important new behaviour has suitable coverage
- The core journey was manually exercised
- Form success and error states were checked
- Responsive behaviour was checked
- Existing failures are distinguished from new failures
- Build warnings were reviewed
- Visual changes were checked in preview

## `.ai/quality-gates/release-checklist.md`

Include:

- Scope is complete
- Critical findings are resolved
- Lint passes
- Tests pass
- Build passes
- Documentation is current
- Environment changes are documented
- Legal placeholders remain marked
- Links work
- Production assumptions are explicit
- The user explicitly instructed release

---

# 7. Create `arc42/`

Create:

```text
arc42/
├── 01-introduction-and-goals.md
├── 02-constraints.md
├── 03-context-and-scope.md
├── 04-solution-strategy.md
├── 05-building-blocks.md
├── 06-runtime-view.md
├── 07-deployment-view.md
├── 08-cross-cutting-concepts.md
├── 09-adrs.md
├── 10-quality-requirements.md
├── 11-risks-and-technical-debt.md
├── 12-glossary.md
└── developer-context.md
```

Keep each chapter concise and specific.

## Initial content

### `01-introduction-and-goals.md`

Cover:

- Product purpose
- Creator and supporter audiences
- Current validation phase
- Long-term direction
- Current non-goals

### `02-constraints.md`

Cover:

- Pre-launch honesty
- Small-team maintainability
- Strong SEO
- Responsive web first
- GDPR-aware handling
- Future payments and payouts
- Future support for creators who may be minors
- Avoid premature infrastructure

### `03-context-and-scope.md`

Describe:

- Anonymous visitor
- Creator prospect
- Supporter prospect
- Marketing website
- Early-access submission service
- Future payment provider
- Future identity and payout provider
- Vercel
- Search engines

Use Mermaid diagrams where useful.

### `04-solution-strategy.md`

Describe:

- Server-rendered Next.js marketing site
- Typed content and reusable components
- Local blog content
- Isolated form integration
- Architecture that can evolve without building the full app too early

### `05-building-blocks.md`

Describe:

- Marketing pages
- Shared design system
- SEO utilities
- Blog content
- Form service
- Legal pages
- Analytics abstraction
- Public assets

### `06-runtime-view.md`

Describe:

- Visitor loads a public page
- Server renders content
- Metadata is produced
- Visitor submits early-access interest
- Server validates and forwards to the configured service
- Success or failure is shown honestly

### `07-deployment-view.md`

Describe:

- GitHub repository
- Vercel previews
- Production deployment
- Environment variables
- `buymeatee.com`

### `08-cross-cutting-concepts.md`

Cover:

- Accessibility
- SEO
- Product honesty
- Personal data
- Brand terminology
- Responsive design
- Observability
- Error handling
- Security
- Future payments and payouts

### `09-adrs.md`

Use this format:

```markdown
## ADR-001: Decision title

### Status
Accepted

### Context

### Decision

### Alternatives considered

### Consequences
```

Create these only if they are true after implementation:

- ADR-001: Use Next.js App Router for the public website
- ADR-002: Server-render public content by default
- ADR-003: Use local structured content or MDX before adding a CMS
- ADR-004: Isolate early-access submission behind a service boundary
- ADR-005: Do not introduce database, authentication or payments during initial validation
- ADR-006: Use design tokens and reusable components as the shared UI foundation
- ADR-007: Clearly label fictional product examples

Do not manufacture decisions that have not been made.

### `10-quality-requirements.md`

Include measurable expectations for:

- Performance
- Accessibility
- SEO
- Maintainability
- Product honesty
- Security
- Responsive behaviour

### `11-risks-and-technical-debt.md`

Include:

- Chicken-and-egg creator acquisition
- Unvalidated demand
- Payment and payout complexity
- Identity verification
- Refunds and chargebacks
- Creator moderation
- Misuse of funds
- Minor creators
- Country-specific regulation
- Platform fees
- Copyright and image licensing
- Spam submissions
- Temporary legal copy
- Placeholder photography

### `12-glossary.md`

Define:

- Creator
- Supporter
- Goal
- Journey
- Tee
- Support option
- Green fee
- Early access
- Creator page
- Supporter collection

### `developer-context.md`

Create a compact summary of:

- Product
- Stack
- Core rules
- Repository map
- Verification
- Current phase
- Key decisions
- Known risks

---

# 8. Create context files

Create:

## `.ai/context/product.md`

Include:

- Product vision
- Audiences
- Jobs to be done
- Value propositions
- Core terminology
- Current hypothesis
- Validation questions

Questions:

- Will golf creators share a BuyMeATee page?
- Will supporters understand “buy a tee”?
- Do supporters prefer general support or specific goals?
- Which creator segments are most interested?
- What support amounts feel natural?
- Do supporters want updates, badges or exclusive content?
- How much trust information is needed before contributing?

## `.ai/context/current-phase.md`

State:

- Current phase is marketing and early-access validation.
- The full app is not yet being built.
- Current success is measured through interest and quality signals, not transaction volume.

Suggested future phases:

1. Marketing site
2. Early-access validation
3. Creator-profile prototype
4. Support-flow prototype
5. Payment architecture decision
6. Creator dashboard
7. Supporter account and activity
8. Discovery and growth

Do not present future phases as committed dates.

## `.ai/context/brand.md`

Include:

- Exact name
- Primary proposition
- Tone
- Palette
- Typography direction
- Approved CTA language
- Disallowed claims
- Logo guidance
- Reference to supplied concepts

## `.ai/context/links.md`

Include:

- Repository URL
- SSH URL
- Production domain
- Design-reference locations
- Vercel project URL once known
- Analytics URL once known
- Future documentation links

Do not include secrets.

---

# 9. Create artifacts folders

Create:

```text
.ai/artifacts/current/
.ai/artifacts/archive/
```

Add a short README explaining:

- `current/` is for active discovery reports, audits, screenshots, release notes and temporary plans.
- `archive/` is for superseded working material.
- Permanent knowledge belongs in `CLAUDE.md`, `.ai/skills/`, `.ai/context/` or `arc42/`.

Do not fill the repository with unnecessary generated documents.

---

# 10. Create GitHub issue and PR conventions

Create templates under:

```text
.github/ISSUE_TEMPLATE/
```

Create:

- `feature.md`
- `bug.md`
- `research.md`
- `content-and-seo.md`
- `architecture-decision.md`

Each issue should encourage:

- Problem
- User
- Desired outcome
- Scope
- Non-goals
- Acceptance criteria
- UX or copy notes
- Analytics considerations
- SEO considerations
- Security or privacy considerations
- Files or modules likely affected
- Reuse-versus-build assessment
- Verification plan
- Dependencies

Create `.github/pull_request_template.md` containing:

- Summary
- Linked issues
- Screenshots
- Verification
- Quality gates
- Risks
- Documentation updated
- Release notes

---

# 11. Define labels and milestones

Document and, where authenticated GitHub access is available, create:

## Type

- `type:feature`
- `type:bug`
- `type:enhancement`
- `type:research`
- `type:content`
- `type:architecture`

## Area

- `area:marketing`
- `area:seo`
- `area:content`
- `area:design-system`
- `area:creator`
- `area:supporter`
- `area:payments`
- `area:platform`
- `area:legal`
- `area:analytics`

## Priority

- `priority:critical`
- `priority:high`
- `priority:medium`
- `priority:low`

## Status

- `status:needs-discovery`
- `status:ready`
- `status:blocked`
- `status:in-review`

## Source

- `source:founder`
- `source:user-research`
- `source:analytics`
- `source:seo`
- `source:support`

Create or document these milestones:

### Marketing Wave 1 — Foundation

- Project setup
- Design system
- Homepage
- Navigation and footer
- Deployment foundation

### Marketing Wave 2 — Audiences

- For creators
- For supporters
- How it works
- About
- FAQ

### Marketing Wave 3 — SEO and content

- Technical SEO
- Blog architecture
- Launch articles
- Internal linking
- Structured data

### Marketing Wave 4 — Early access

- Creator-interest form
- Supporter-interest form
- Form integration
- Privacy alignment
- Analytics events

### Marketing Wave 5 — Launch polish

- Responsive review
- Accessibility review
- Performance review
- Production content
- Final imagery
- Legal review
- Domain launch

### Product Discovery

- Creator interviews
- Supporter interviews
- Payment and payout research
- Prototype testing
- Pricing research

Do not create a large speculative backlog for the full application yet.

---

# 12. Add a reproducible GitHub setup script

Where practical, create:

```text
scripts/setup-github-project.sh
```

It may use the GitHub CLI to create labels, milestones and initial issues.

Requirements:

- Safe to rerun
- Avoid duplicates
- Explain required authentication
- Contain no tokens
- Stop clearly on meaningful errors
- Target the current repository
- Be documented in the README

If GitHub access is not authenticated, create and validate the script without pretending the remote project was changed.

---

# 13. Seed the initial backlog

Create or prepare these issues:

1. Establish project foundation and design tokens
2. Build responsive global navigation and footer
3. Build homepage hero and proposition sections
4. Build creator and supporter audience panels
5. Build support-option and example-goal previews
6. Build For Creators page
7. Build For Supporters page
8. Build How It Works page
9. Build FAQ and About pages
10. Implement technical SEO foundation
11. Create blog architecture
12. Publish four launch articles
13. Implement early-access registration interface
14. Connect and validate form submission service
15. Add privacy and terms drafts
16. Complete accessibility and responsive audit
17. Complete performance and SEO audit
18. Prepare production launch

Once relevant code exists, seam-map each issue with:

- Likely files
- Existing components to reuse
- New components needed
- Verification path

Do not guess file paths before inspecting the implementation.

---

# 14. Keep documentation alive

Add this rule:

Whenever a task reveals a reusable lesson, decide whether it belongs in:

- `CLAUDE.md` for a critical universal rule
- `.ai/skills/` for stack knowledge
- `.ai/workflows/` for process
- `.ai/quality-gates/` for repeatable checks
- `arc42/` for architecture or decisions
- `.ai/context/` for product and brand knowledge

Do not leave important knowledge only in chat.

When an architectural decision changes:

1. Update the old ADR status.
2. Add the replacement ADR.
3. Update affected arc42 chapters.
4. Update skills and `CLAUDE.md` where necessary.

Stale documentation is a defect.

---

# 15. Definition of done

The workflow setup is complete when:

- `CLAUDE.md` exists and accurately reflects the project.
- `.ai/` contains BuyMeATee-specific agents, skills, workflows, gates and context.
- `arc42/` describes the actual initial system.
- Initial ADRs describe real decisions.
- Issue and PR templates exist.
- Labels and milestones are documented.
- A safe GitHub setup script exists where practical.
- The initial backlog is prepared or created.
- Verification commands match the real project.
- The README explains the workflow.
- No assumptions from unrelated products remain.
- The workflow does not claim systems exist when they do not.

---

# Final report

When complete, report:

1. Files and folders created
2. Agents created
3. Skills created
4. Workflows created
5. Quality gates created
6. Arc42 chapters and ADRs created
7. GitHub templates and automation created
8. Issues and milestones created remotely, or why that was not possible
9. Current verification commands
10. Assumptions requiring confirmation
11. Recommended first wave

Build and verify the workflow, but pause before committing unless explicitly instructed to release.
