# Skill: SEO

> **Status: implemented.** Utilities: `lib/seo/metadata.ts` (canonical + metadata builders), `lib/seo/structured-data.ts` (WebSite, Breadcrumb, FAQ, Article JSON-LD), `components/structured-data.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, `app/opengraph-image.tsx` (generated social image). FAQ JSON-LD is emitted only on `/faq` where all questions are visible.

## Identity

- Site name: `BuyMeATee`
- Canonical origin: `https://buymeatee.com`
- Default title: `BuyMeATee — Support the Golf Journey`
- Title template: `%s | BuyMeATee`

## Metadata

- Unique title, description and canonical per route, built through `pageMetadata()` in `lib/seo/metadata.ts` — always use the helper (it also carries the default OG image, which page-level `openGraph` objects would otherwise drop).
- Open Graph and Twitter/X card metadata on every route; a default social-sharing image.
- No accidental `noindex`; robots and sitemap must agree with intent.

## Structured data

- WebSite / Organisation data only where factually appropriate (no invented org details).
- Article structured data on blog posts; Breadcrumb structured data on internal pages; FAQ structured data **only** for visible matching content.
- Structured data must always match what the visitor can see.

## Sitemap and robots

Dynamic `sitemap.ts` covering all public routes and blog articles; `robots.txt` allowing indexing of public content.

## Content rules

- One clear H1 per page; logical heading hierarchy; server-rendered important copy.
- Internal links between related pages (blog ↔ product pages) with descriptive anchor text.
- Keyword themes (use naturally, never mechanically): support golf creators, golf creator support, support an aspiring golfer, fund a golf journey, golf sponsorship for individuals, sponsor a golfer, golf creator platform.
- No duplicate page intent — check before adding pages or articles.

## Verification

Run the [SEO checklist](../quality-gates/seo-checklist.md): metadata output, canonicals, sitemap entries, robots, structured-data validity, heading hierarchy, internal links, alt text, server-rendered copy.
