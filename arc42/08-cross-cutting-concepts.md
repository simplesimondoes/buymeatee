# 8. Cross-Cutting Concepts

- **Accessibility** — WCAG-minded from the start: keyboard operation, visible focus, semantic landmarks, labelled forms, contrast, reduced motion, accessible menus/dialogs. Gate: [accessibility checklist](../.ai/quality-gates/accessibility-checklist.md).
- **SEO** — first-class requirement; server-rendered important content, unique metadata, honest structured data. Skill: [.ai/skills/seo.md](../.ai/skills/seo.md).
- **Product honesty** — no fake users/stats/claims; fiction labelled; unreleased functions marked as planned. This is enforced in review, not just authored once.
- **Personal data** — minimal collection (early-access form only), consent matching reality, GDPR-aware, no sensitive logging, privacy draft describing actual behaviour.
- **Brand terminology** — Creator/Supporter/Goal/Journey vocabulary and BuyMeATee spelling everywhere, including code identifiers where visible. Reference: [.ai/context/brand.md](../.ai/context/brand.md).
- **Responsive design** — intentional design at 375/768/1024/1440px; part of the definition of done.
- **Observability** — currently nothing beyond Vercel's built-in logs/analytics surface. A thin analytics abstraction is planned so a privacy-friendly provider can be added deliberately; no invasive tracking by default, no cookie banner until non-essential cookies actually exist.
- **Error handling** — honest user-facing failure states (especially the form); `error.tsx`/`not-found.tsx` boundaries; errors never leak implementation detail.
- **Security** — secrets server-side only; input validation at the boundary; dependency restraint; dedicated review for anything touching data or money. Gate: [security & privacy checklist](../.ai/quality-gates/security-and-privacy-checklist.md).
- **Future payments and payouts** — treated as a standing constraint: copy phrases security as a design principle, and no current decision may casually foreclose payment/payout architecture (identity verification, refunds, chargebacks, platform risk — see [risks](11-risks-and-technical-debt.md)).
