# BuyMeATee — Build the Marketing Website

You are working in this GitHub repository:

- HTTPS: `https://github.com/simplesimondoes/buymeatee.git`
- SSH: `git@github.com:simplesimondoes/buymeatee.git`
- Production domain: `https://buymeatee.com`

Build the public marketing website for BuyMeATee.

Use the supplied marketing-page concept as the primary visual reference and the supplied mobile-app concepts as supporting product inspiration.

The finished site should feel like a credible new golf brand ready to share publicly, not a generic generated SaaS template.

Before coding:

1. Inspect the repository.
2. Read `CLAUDE.md`.
3. Read the relevant `.ai/` workflow, skills and quality gates.
4. Read the relevant `arc42/` chapters.
5. Use the default wave workflow.
6. Build and verify.
7. Pause before commit, push or deployment unless explicitly told to release.

---

# Product overview

BuyMeATee is a golf-focused creator-support platform.

It allows golf creators, aspiring professionals, amateur competitors, coaches, course reviewers and other golfers to share their journey and specific goals.

Supporters can contribute towards things such as:

- Green fees
- Tournament entry
- Travel and accommodation
- Equipment
- Coaching
- Content production
- A specific golf challenge
- A competitive season

This must not feel like a generic tipping website with golf styling.

The emotional proposition is:

> Support the journey.

Golfers are not simply asking for money. They are inviting supporters to follow and participate in a real golfing journey.

Examples:

- Help me play every Open Championship venue.
- Help me enter the regional amateur season.
- Support my road to scratch.
- Help fund my next independent course-review trip.
- Help me compete in Q School.
- Help me create more independent golf content.

Supporters might:

- Buy one tee
- Buy three tees
- Sponsor nine holes
- Support a full round
- Contribute towards a green fee
- Choose a custom amount

---

# First-release objective

Build the public marketing website first.

Do not build:

- Authentication
- Creator accounts
- Supporter accounts
- Creator dashboard
- Supporter dashboard
- Checkout
- Payments
- Payouts
- Messaging
- Social feed
- Native app
- Full creator discovery

The website should:

1. Explain what BuyMeATee is.
2. Explain who it is for.
3. Make the proposition feel trustworthy.
4. Let creators register interest.
5. Let supporters register interest.
6. Establish a strong SEO foundation.
7. Establish reusable brand and UI foundations.
8. Be deployable on Vercel at `buymeatee.com`.

---

# Technology

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Server components by default
- Server-rendered or statically generated public pages
- Accessible semantic HTML
- Lucide icons where useful
- Local structured content or MDX for the blog
- A lightweight and maintainable component architecture
- ESLint
- A suitable test setup

Avoid unnecessary large UI frameworks.

Use current stable, mutually compatible package versions.

Use:

- `next/image`
- `next/font`
- Centralised metadata utilities
- Typed content structures
- Reusable design tokens

The project must support:

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

If the repository already has equivalent commands, preserve and document them rather than creating duplicates.

Create or update `README.md` with:

- Setup
- Development
- Environment variables
- Testing
- Build
- Deployment
- Content editing
- Workflow usage

---

# Brand name

The exact brand spelling is:

> BuyMeATee

Do not use:

- BuyMeaTee
- Buy Me A Tee
- BuyMea Tee
- Inconsistent casing

Domain:

> buymeatee.com

---

# Brand positioning

Primary line:

> Support the journey.

Primary explanation:

> BuyMeATee is where golf fans help creators play more, achieve more and chase their goals.

Supporting line:

> Follow the journey. Support a goal. Buy them a tee.

Tone:

- Warm
- Aspirational
- Golf-literate
- Premium but approachable
- Community-oriented
- Honest
- British English
- Never charity-like
- Never desperate
- Never overly corporate

Avoid:

- Donate now
- Beg for support
- Crowdfunding platform
- Give us money
- Influencer-only language

Prefer:

- Support
- Back a goal
- Join the journey
- Buy a tee
- Support a round
- Help make the next round happen

---

# Visual direction

Use the supplied concept as the visual reference.

Recreate it as a real responsive website rather than copying AI-generated artefacts or illegible text.

The style should feel like:

- A premium golf publication
- An elegant members' club
- A modern creator platform
- Editorial rather than corporate
- Warm, spacious and image-led

Do not copy the visual identity of an existing golf tournament, brand or publication.

## Suggested palette

Create centralised design tokens.

Suggested starting values:

- Deep forest green: `#073E2E`
- Dark forest: `#052D23`
- Warm cream: `#F6F1E7`
- Soft off-white: `#FCFAF6`
- Warm stone: `#DED5C5`
- Muted gold: `#B69755`
- Ink: `#15201B`
- White: `#FFFFFF`

Adjust where needed for contrast and cohesion.

## Typography

Use:

- A refined editorial serif for major headings
- A clean readable sans serif for body copy, controls and navigation

The hero must feel distinctive and editorial, not like a standard B2B SaaS landing page.

## Logo

Create a usable brand mark inspired by the approved concept:

- Elegant BuyMeATee wordmark
- Subtle golf flag or tee detail
- Deep-green primary version
- White or cream reversed version
- Compact favicon mark
- SVG or programmatic implementation
- Accessible text treatment

Do not rely only on a raster logo image.

Do not imitate a protected golf logo.

---

# Routes

Create:

- `/`
- `/for-creators`
- `/for-supporters`
- `/how-it-works`
- `/about`
- `/faq`
- `/blog`
- `/privacy`
- `/terms`

Create local SEO-ready blog articles at:

- `/blog/how-to-support-a-golf-content-creator`
- `/blog/how-golf-creators-can-fund-their-content`
- `/blog/golf-sponsorship-for-amateur-players`
- `/blog/what-does-it-cost-to-create-golf-content`

Use shared navigation, footer, CTA, metadata and structured-data components.

---

# Homepage

Build the homepage in this order.

## 1. Header

Desktop navigation:

- How it works
- For creators
- For supporters
- Blog
- FAQ

Primary action:

> Start your page

Secondary action:

> Join early access

Do not include a functional login unless authentication exists.

A `Log in` link may be omitted or labelled `Coming soon`, but do not create a dead or misleading action.

Use an accessible mobile menu.

The header should blend naturally into the hero and remain readable.

## 2. Hero

Heading:

> Support the journey.

Body:

> BuyMeATee is where golf fans help creators play more, achieve more and chase their goals.

Primary CTA:

> Find golf creators

For the pre-launch site, this should scroll to supporter early access or explain that creator discovery is coming soon.

Secondary CTA:

> Start your page

This should scroll to or open creator early access.

Use authentic golf imagery showing a creator, aspiring player or relatable golfer.

Do not use fake reviews, user counts, partner logos or trust statistics.

Use honest supporting copy such as:

> Built for golf creators and the people who follow their journey.

## 3. How it works

Eyebrow:

> How it works

Heading:

> Simple. Transparent. Golf.

Three steps:

### Creators share their goals

Golfers create a page, tell their story and show supporters what they are working towards.

### Fans buy a tee

Supporters choose a meaningful contribution, from a single tee to nine holes, a full round or a custom amount.

### The journey continues

Creators share progress, milestones and updates so supporters can see what they helped make possible.

CTA:

> See how it works

## 4. Who it is for

Create two strong side-by-side panels.

### For golf creators

Heading:

> Turn followers into part of the journey.

Points:

- Share your story and goals
- Receive direct support from your community
- Keep supporters updated
- Celebrate progress and milestones
- Spend more time creating and playing

CTA:

> Start your page

Include a polished fictional creator card labelled `Example`.

Example content:

- Alex Morgan
- 7.8 handicap
- Road to Scratch
- £640 of £1,200
- 53% progress

### For golf fans

Heading:

> Support the golfers you believe in.

Points:

- Buy a tee or support a specific goal
- Follow progress and updates
- Be part of the golfer's story
- Discover emerging golf creators
- Celebrate achievements together

CTA:

> Join as a supporter

Include a supporter collection or journey preview inspired by the supplied app concept.

Clearly label it as a preview.

## 5. Support options

Present the golf-specific support mechanic:

- 1 Tee
- 3 Tees
- 9 Holes
- 18 Holes
- Green Fee
- Custom Support

Explain:

> Creators will be able to customise support options and show what each contribution helps fund.

This is illustrative only.

Do not implement checkout.

## 6. Example goals

Create visually rich sample goal cards.

Use examples such as:

- Scotland Links Trip
- Road to Scratch
- Amateur Championship Entry
- Independent Course Reviews
- First Professional Season
- Women's Golf Content Series

Each card should include:

- Image
- Fictional creator name
- Goal description
- Progress bar
- Amount and target
- Preview CTA

Every fictional profile must be labelled `Example` or `Concept`.

Do not make fictional users look like real customers.

## 7. More than a tip jar

Heading:

> More than just a tip jar.

Copy:

> BuyMeATee is designed around real golfing goals, visible progress and an ongoing connection between creators and the people supporting them.

Features:

- Goal based
- Secure and transparent
- Community first
- Built specifically for golf

Because no payment provider has been selected, phrase security as a design principle rather than a currently verified payment claim.

For example:

> Designed around transparent goals and responsible payments.

Do not claim named provider protection.

## 8. Early-access section

Create two selectable routes:

- I'm a golf creator
- I'm a supporter

Collect:

- Name
- Email
- Role
- Country
- Creator profile or social link, optional
- Optional response to: `What would you use BuyMeATee for?`

Include:

- Consent text
- Privacy-policy link
- Validation
- Loading state
- Success state
- Error state

Build submission behind a clear service boundary.

Requirements:

- Support a configurable API endpoint through environment variables.
- Never expose private keys in client code.
- Do not fake success.
- If no endpoint is configured, show a graceful and honest alternative.
- Keep backend integration swappable.
- Document how to connect Supabase, Formspree, Loops, ConvertKit or another service later.
- Do not introduce a database solely for the first static launch unless explicitly justified.

Suggested environment value:

```env
NEXT_PUBLIC_SITE_URL=https://buymeatee.com
EARLY_ACCESS_API_URL=
```

Do not commit secrets.

## 9. FAQ preview

Include:

- What is BuyMeATee?
- Who can create a page?
- Is BuyMeATee only for influencers?
- What can supporters contribute towards?
- How will payments work?
- When will BuyMeATee launch?

Do not invent fees or dates.

Payment wording should say the product is in early development and final payment and fee details will be published transparently before launch.

## 10. Final CTA

Heading:

> Ready to support the journey?

Creator CTA:

> Start your page

Supporter CTA:

> Join early access

## 11. Footer

Include:

- Brand summary
- Product links
- Company links
- Legal links
- Copyright year generated dynamically
- `buymeatee.com`

Only show social links where a real destination is configured.

Do not show dead social icons.

---

# Supporting pages

## `/for-creators`

Explain:

- Who it is for
- Goal-based support
- Example goals
- Benefits
- Planned creator workflow
- Early-access CTA

Audience examples:

- YouTube golf creators
- TikTok golf creators
- Instagram golf creators
- Amateur tournament golfers
- Aspiring professionals
- Golf coaches
- Course reviewers
- Golf travel creators
- Women's golf creators
- Adaptive golf creators
- Junior golfers represented by a parent or guardian

Do not imply minors can independently enter financial agreements.

State that accounts involving minors will require an appropriate parent or guardian.

The platform should feel appropriate for small and emerging creators, not only famous influencers.

## `/for-supporters`

Explain:

- How supporters discover golfers
- How they choose a goal
- What buying a tee means
- Planned progress updates
- Future badges and collections
- The difference between support and purchasing investment, ownership or guaranteed content

## `/how-it-works`

Show two journeys.

### Creator journey

1. Create a page
2. Share your story
3. Add a goal
4. Share your link
5. Receive support
6. Post updates

### Supporter journey

1. Discover a creator
2. Choose a goal
3. Buy a tee
4. Leave a message
5. Follow progress
6. Celebrate milestones

Clearly mark unreleased functions as planned.

## `/about`

Tell the story:

> BuyMeATee was created from the belief that golf audiences want a more meaningful way to support the players and creators they follow. A coffee is quickly forgotten; a tee, a round, a tournament entry or a journey creates a story.

Do not invent:

- A team
- Funding
- Headquarters
- Launch history
- Partnerships

## `/faq`

Create crawlable FAQ groups:

- General
- For creators
- For supporters
- Payments and fees
- Safety and trust
- Launch and availability

Add FAQ structured data only for visible matching content.

## `/privacy`

Create an accurate pre-launch privacy draft reflecting what the site actually collects.

Clearly mark it for legal review.

Do not include fictional processors or services.

## `/terms`

Create a sensible pre-launch terms draft.

Clearly mark it for legal review.

Do not present it as professional legal advice.

---

# Blog

Create an SEO-ready local content architecture using MDX or typed structured content.

Do not add a CMS yet.

Each article should include:

- Title
- Slug
- Description
- Author
- Publication date
- Updated date
- Reading time
- Hero image
- Body content
- Internal links
- Article structured data

Use an honest author label such as:

> BuyMeATee Editorial

## Article 1

Slug:

`/blog/how-to-support-a-golf-content-creator`

Title:

> How to Support a Golf Content Creator

Cover:

- Watching and engaging
- Sharing content
- Direct support
- Goal-based support
- Constructive feedback
- Community participation

## Article 2

Slug:

`/blog/how-golf-creators-can-fund-their-content`

Title:

> How Golf Creators Can Fund Better Content

Cover:

- Green fees
- Travel
- Filming
- Editing
- Equipment
- Transparent goals
- Supporter expectations

## Article 3

Slug:

`/blog/golf-sponsorship-for-amateur-players`

Title:

> Golf Sponsorship for Amateur Players: A Practical Guide

Cover:

- Traditional sponsorship
- Community support
- Local businesses
- Goal transparency
- Governing-body and competition rules

Do not make inaccurate amateur-status claims.

State that governing-body, competition and jurisdiction rules vary and must be checked.

## Article 4

Slug:

`/blog/what-does-it-cost-to-create-golf-content`

Title:

> What Does It Cost to Create Golf Content?

Cover:

- Course fees
- Travel
- Equipment
- Cameras
- Audio
- Editing
- Time
- Insurance or permissions where relevant

Do not present invented universal averages.

## Blog quality

Each article should:

- Be genuinely useful
- Use clear headings
- Avoid AI filler
- Avoid keyword stuffing
- Avoid unsupported statistics
- Be easy to migrate to a CMS later
- Link naturally to relevant product pages
- Use approximately 900–1,500 words where appropriate

---

# SEO

SEO is a first-class requirement.

## Technical SEO

Implement:

- Unique metadata per route
- Canonical URLs
- Open Graph metadata
- X or Twitter card metadata
- Dynamic sitemap
- `robots.txt`
- Web manifest
- Favicons and icons
- Semantic heading hierarchy
- Descriptive alt text
- Breadcrumbs on internal pages
- Breadcrumb structured data
- WebSite or Organisation structured data where factually appropriate
- FAQ structured data only where visible
- Article structured data
- Clean internal linking
- Server-rendered important copy
- No accidental duplicate pages

Use:

- Site name: `BuyMeATee`
- Canonical origin: `https://buymeatee.com`
- Default title: `BuyMeATee — Support the Golf Journey`
- Title template: `%s | BuyMeATee`

Suggested homepage description:

> Support golf creators, aspiring players and independent voices as they chase meaningful goals. Follow the journey and buy them a tee.

## Keyword themes

Use naturally:

- Support golf creators
- Golf creator support
- Support an aspiring golfer
- Fund a golf journey
- Golf crowdfunding
- Golf sponsorship for individuals
- Support amateur golfers
- Golf content creators
- Sponsor a golfer
- Golf creator platform

Do not repeat phrases mechanically.

## SEO verification

Check:

- Metadata output
- Canonicals
- Sitemap entries
- Robots
- Structured data validity
- Heading hierarchy
- Internal links
- Image alt text
- Server-rendered copy
- No duplicate intent
- No accidental noindex

Run the SEO quality gate before reporting completion.

---

# Accessibility

Meet strong WCAG-minded standards.

Requirements:

- Keyboard-accessible navigation
- Visible focus states
- Correct labels
- Proper error associations
- Sufficient contrast
- Reduced-motion support
- Meaningful button text
- No text only embedded in images
- Correct landmarks
- Accessible mobile menu
- Accessible dialogs
- Practical touch targets
- No information conveyed only by colour

Run the accessibility quality gate.

---

# Responsive behaviour

Design intentionally for:

- 375px mobile
- 768px tablet
- 1024px desktop
- 1440px large desktop

Pay attention to:

- Hero cropping
- Heading size
- Navigation
- CTA stacking
- Creator cards
- Goal cards
- Forms
- Blog typography
- Footer density

Do not simply stack the desktop layout on mobile.

---

# Performance

Target excellent Lighthouse performance.

Requirements:

- Optimised images
- Appropriate formats
- No unnecessary animation library
- Minimal client JavaScript
- Avoid layout shift
- Lazy-load below-the-fold media
- Correct image dimensions
- Prefer CSS transitions
- Respect `prefers-reduced-motion`
- Avoid unnecessary third-party scripts

---

# Analytics

Create a small analytics abstraction but do not install invasive analytics by default.

Document how a privacy-friendly provider can be connected later.

Future events should include:

- Creator CTA clicked
- Supporter CTA clicked
- Early-access form opened
- Early-access form submitted
- FAQ opened
- Blog article viewed

Do not add a cookie banner unless non-essential cookies or tracking are actually introduced.

---

# Product honesty

This is a pre-launch concept.

Do not include:

- Fake creators presented as real
- Fake testimonials
- Fake reviews
- Fake user counts
- Fake transaction totals
- Fake press logos
- Fake partners
- Claims that payments are live
- Dead product flows without explanation

Demo UI must be labelled:

- Example
- Preview
- Concept

---

# Image handling

Use the supplied design as inspiration.

Requirements:

- Keep image references centralised.
- Use licensed, original or safe placeholder imagery.
- Do not copy copyrighted images from other golf sites.
- Ensure placeholders are visually coherent.
- Add descriptive alt text.
- Use `next/image`.
- Keep replacement straightforward.

Create an image requirements document containing:

- Placement
- Aspect ratio
- Subject
- Recommended minimum resolution
- Alt-text direction
- Licensing requirement

Suggested image slots:

- Hero
- Creator audience panel
- Supporter audience panel
- Six example goals
- Four blog heroes
- About page
- Social sharing default

---

# Component architecture

Create reusable components, potentially including:

- `Header`
- `MobileNavigation`
- `Footer`
- `Hero`
- `SectionHeading`
- `CreatorPreviewCard`
- `GoalCard`
- `SupportOptionCard`
- `ProgressBar`
- `AudiencePanel`
- `FeatureGrid`
- `FAQAccordion`
- `EarlyAccessForm`
- `CallToAction`
- `Breadcrumbs`
- `BlogCard`
- `StructuredData`

Use a cleaner structure if appropriate.

Do not put the entire homepage in one oversized component.

Centralise:

- Navigation
- Footer links
- FAQ entries
- Sample goals
- Support options
- Social links
- Metadata
- Brand configuration

---

# Form architecture

Keep form submission isolated behind a service boundary.

Requirements:

- Typed input schema
- Server-side validation where submission occurs
- Client-side feedback
- No secrets in the browser
- Honest success and failure states
- Swappable provider
- Minimal personal-data collection
- Consent and privacy link
- No sensitive logging
- Spam-resistance considerations documented

Do not implement a database unless explicitly justified and recorded as an ADR.

---

# Environment

Create or update `.env.example`.

Include safe placeholders only:

```env
NEXT_PUBLIC_SITE_URL=https://buymeatee.com
EARLY_ACCESS_API_URL=
```

Add any further values only if actually needed.

Never commit secrets.

---

# Tests and quality

Add useful tests for:

- Navigation
- Mobile menu
- Form validation
- Form success and error behaviour where practical
- FAQ interaction
- Metadata helpers
- Blog content parsing
- Sitemap generation where valuable

Avoid brittle snapshot-heavy testing.

Run:

```bash
npm run lint
npm run test
npm run build
```

Also check:

- Broken internal links
- Missing metadata
- Empty or inappropriate alt text
- Heading hierarchy
- Mobile overflow
- Console errors
- Hydration warnings
- Form accessibility
- Structured data
- Responsive screenshots

---

# Deliverables

Complete the implementation rather than only writing a plan.

Deliver:

1. Working Next.js project
2. Responsive homepage
3. Supporting marketing pages
4. SEO-ready blog
5. Four launch articles
6. Early-access form interface
7. Isolated form submission service
8. Metadata, sitemap, robots and structured data
9. Logo and favicon assets
10. Reusable design-system foundations
11. Privacy and terms drafts marked for review
12. README
13. `.env.example`
14. Image requirements document
15. Tests
16. Successful lint, test and production build

---

# Execution order

1. Inspect the repository.
2. Read the workflow and architecture documentation.
3. Confirm the current stack.
4. Establish design tokens and shared layout.
5. Build the homepage.
6. Build supporting pages.
7. Add SEO infrastructure.
8. Add blog architecture and articles.
9. Add early-access form.
10. Add legal drafts.
11. Test responsive behaviour.
12. Run accessibility review.
13. Run SEO review.
14. Run lint, tests and build.
15. Fix meaningful errors.
16. Update project documentation.
17. Report completion.
18. Pause before release.

Make sensible decisions without pausing for minor questions.

Record assumptions in the repository.

Do not silently expand scope into the full application.

---

# Final report

When complete, report:

- Summary of what was built
- Route list
- Important architecture decisions
- SEO features
- Form behaviour
- Placeholder assets still needing replacement
- Legal items requiring review
- Test and build results
- Accessibility findings
- Performance findings
- Known limitations
- Recommended next five tasks

Do not commit, push or deploy until explicitly instructed to release.
