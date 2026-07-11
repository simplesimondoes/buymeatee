# 10. Quality Requirements

Measurable expectations for the marketing site. Verify before release; failures are defects, not aspirations.

| Quality | Requirement |
| --- | --- |
| **Performance** | Lighthouse Performance ≥ 90 on mobile for key pages; no layout shift on load (CLS < 0.1); images optimised via `next/image`; below-the-fold media lazy-loaded; no unnecessary third-party scripts. |
| **Accessibility** | Lighthouse Accessibility ≥ 95; full keyboard operability; WCAG AA contrast; reduced-motion respected; zero unlabelled form controls. |
| **SEO** | Every public route: unique title/description, canonical, valid Open Graph; sitemap complete; structured data validates and matches visible content; important copy server rendered; Lighthouse SEO ≥ 95. |
| **Maintainability** | TypeScript strict with no unexplained `any`; tokens/typed content instead of scattered values; dependencies individually justified; documentation current (stale docs are defects). |
| **Product honesty** | Zero unlabelled fictional content; zero unverifiable claims; legal drafts visibly marked for review. Audited via the [content checklist](../.ai/quality-gates/content-checklist.md). |
| **Security & privacy** | No secrets client-side or in the repo; server-side validation on all submissions; no personal data in logs; consent text matches actual processing. |
| **Responsive behaviour** | Correct, intentionally designed layout at 375, 768, 1024 and 1440px; no horizontal overflow; touch targets ≥ 44px. |
