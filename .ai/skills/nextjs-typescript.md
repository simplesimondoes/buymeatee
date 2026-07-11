# Skill: Next.js + TypeScript

> **Status: planned conventions.** No code exists yet. These are the conventions to establish when the project is scaffolded (Marketing Wave 1). Once real code exists, update this file to describe the *actual* structure and remove this notice.

## Stack

Next.js App Router, TypeScript (strict), Tailwind CSS, deployed on Vercel. Current stable, mutually compatible versions.

## App Router conventions

- Routes live under `app/` with one folder per route (`app/for-creators/page.tsx` etc.).
- Shared layout (header, footer, fonts, global metadata) in `app/layout.tsx`.
- Server components by default. Add `"use client"` only for genuine interactivity (mobile menu, FAQ accordion, early-access form) and keep those components as small leaves.
- Public marketing pages must be server rendered or statically generated — never client-fetch important copy.

## Metadata

- Centralise metadata construction in a shared utility (see [seo.md](seo.md)); every route exports unique `metadata` / `generateMetadata`.
- Canonical origin comes from `NEXT_PUBLIC_SITE_URL`, defaulting to `https://buymeatee.com`.

## TypeScript expectations

- `strict: true`; no `any` unless narrowly justified with a comment.
- Content (navigation, FAQ entries, sample goals, support options, blog front-matter) is typed data, not loose objects scattered through components.
- Use the `@/` import alias for project-root imports; group imports external → internal.

## Error and loading boundaries

- Provide a root `not-found.tsx` and a sensible `error.tsx`.
- Loading boundaries only where genuinely useful — static marketing pages should not need them.

## Adding dependencies

Every new dependency needs a reason existing tools can't satisfy. Prefer: Tailwind over UI kits, CSS transitions over animation libraries, hand-rolled small components over imported ones. Lucide icons are pre-approved. Record anything architectural as an ADR.
