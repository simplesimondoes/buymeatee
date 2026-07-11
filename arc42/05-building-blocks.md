# 5. Building Blocks

> Implemented (July 2026). Real paths below.

| Block | Responsibility | Location |
| --- | --- | --- |
| **Marketing pages** | `/`, `/for-creators`, `/for-supporters`, `/how-it-works`, `/about`, `/faq`, `/blog`, `/privacy`, `/terms` — statically generated pages composed from shared components. | `app/*/page.tsx`; homepage sections in `components/home/` |
| **Shared design system** | Design tokens (CSS variables) + reusable components: header, mobile navigation, footer, section heading, creator preview card, goal card, progress bar, example badge, FAQ accordion, CTA, breadcrumbs, page header, blog card, structured data. | `app/globals.css`, `components/` |
| **SEO utilities** | Central metadata construction, canonicals, Open Graph (incl. generated social image), structured-data builders, dynamic sitemap, robots, manifest. | `lib/seo/`, `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, `app/opengraph-image.tsx` |
| **Blog content** | Typed structured articles (blocks + inline links) with full front-matter, rendered at `/blog` and `/blog/[slug]` with Article JSON-LD. | `lib/content/blog.ts`, `lib/content/articles/`, `lib/content/inline.ts`, `components/article-body.tsx` |
| **Form service** | Early-access form UI + isolated submission boundary (shared schema, server validation, `EARLY_ACCESS_API_URL`, honeypot, honest states). | `components/early-access-form.tsx`, `lib/early-access/`, `app/api/early-access/route.ts` |
| **Legal pages** | Privacy and terms drafts, clearly marked for legal review. | `app/privacy/`, `app/terms/` |
| **Analytics abstraction** | Thin typed event API with no provider installed by default. | `lib/analytics.ts` |
| **Public assets** | Programmatic logo (SVG mark + wordmark component), imagery, web manifest, generated icons. Image slots documented. | `components/logo.tsx`, `app/icon.svg`, `app/apple-icon.tsx`, `public/images/`, [.ai/context/image-requirements.md](../.ai/context/image-requirements.md) |
