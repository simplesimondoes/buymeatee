# 5. Building Blocks

> Planned decomposition — record real paths once implemented.

| Block | Responsibility |
| --- | --- |
| **Marketing pages** | `/`, `/for-creators`, `/for-supporters`, `/how-it-works`, `/about`, `/faq`, `/privacy`, `/terms` — server-rendered pages composed from shared components. |
| **Shared design system** | Design tokens (colour, type, spacing, radius) plus reusable components: header, mobile navigation, footer, hero, section headings, creator preview card, goal card, support option card, progress bar, audience panel, feature grid, FAQ accordion, CTA, breadcrumbs, blog card, structured data. |
| **SEO utilities** | Central metadata construction, canonical handling, Open Graph, structured-data builders, dynamic sitemap, robots. |
| **Blog content** | Local typed/MDX articles with front-matter (title, slug, description, author, dates, reading time, hero image) rendered at `/blog` and `/blog/[slug]`. |
| **Form service** | Early-access form UI + isolated submission service boundary (validation, `EARLY_ACCESS_API_URL`, honest states). |
| **Legal pages** | Privacy and terms drafts, clearly marked for legal review. |
| **Analytics abstraction** | Thin event API (creator CTA clicked, supporter CTA clicked, form opened/submitted, FAQ opened, article viewed) with no invasive provider installed by default. |
| **Public assets** | Logo (SVG wordmark + favicon mark), imagery, web manifest, icons. Image slots documented in an image requirements document. |
