# 2. Constraints

| Constraint | Implication |
| --- | --- |
| **Pre-launch honesty** | No fake users, reviews, stats, partners or payment claims. Fiction is labelled Example/Preview/Concept. Copy is honest about early development. |
| **Small-team maintainability** | One founder plus AI sessions. Boring, well-documented choices beat clever ones. Minimal dependencies and operational surface. |
| **Strong SEO** | Public content server rendered or static; unique accurate metadata; structured data matching visible content. SEO is a first-class requirement, not a retrofit. |
| **Responsive web first** | Designed at 375/768/1024/1440px. No native apps this phase. |
| **GDPR-aware handling** | UK/EU audience. Minimal personal data, real consent text, privacy documentation matching reality, no sensitive logging. |
| **Future payments and payouts** | Nothing built now may casually foreclose payment/payout architecture. Money-touching decisions require ADRs and dedicated security review. |
| **Creators who may be minors** | Junior golfers appear via parent/guardian. Copy and future flows must never imply minors contract independently. |
| **Avoid premature infrastructure** | No database, auth, CMS or backend services during validation without an explicit product need recorded as an ADR ([ADR-005](09-adrs.md)). |
| **Budget/hosting** | Vercel hosting with GitHub integration; production domain `buymeatee.com`. |
