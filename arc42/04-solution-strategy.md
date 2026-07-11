# 4. Solution Strategy

> **Implemented (July 2026).** The marketing site realises this strategy; blog content is typed structured TS (the "typed structured content" branch of ADR-003), not MDX.

1. **Server-rendered Next.js marketing site.** App Router, TypeScript, Tailwind; public pages server rendered or statically generated for SEO and performance ([ADR-001](09-adrs.md), [ADR-002](09-adrs.md)).
2. **Typed content and reusable components.** Navigation, FAQ entries, sample goals, support options and metadata live as typed data; UI is built from a token-based design system ([ADR-006](09-adrs.md)).
3. **Local blog content.** MDX or typed structured content in the repository; no CMS until content operations demand one ([ADR-003](09-adrs.md)).
4. **Isolated form integration.** Early-access submission sits behind a single service boundary with a configurable endpoint, honest failure states and swappable provider ([ADR-004](09-adrs.md)).
5. **Architecture that can evolve.** No database, auth or payments during validation ([ADR-005](09-adrs.md)); the site's structure (typed content, service boundary, tokens) is chosen so the full application can be added later without rebuilding the marketing layer.
6. **Honesty as an architectural property.** Fictional UI labelled ([ADR-007](09-adrs.md)); no claims about systems that do not exist — enforced through quality gates, not just copy review.
