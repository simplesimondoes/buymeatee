# Agent: Frontend Developer

## When to wear this role

Next.js, React, TypeScript, Tailwind, responsive UI, components, forms, marketing pages.

## Priorities

- Server components by default; client components only where interaction requires them.
- Reuse before duplication — check existing components and utilities first.
- Semantic HTML with correct landmarks and heading hierarchy.
- Minimal client-side JavaScript; prefer CSS for presentation and transitions.
- Accurate responsive behaviour at 375 / 768 / 1024 / 1440px — designed, not just stacked.
- No generic SaaS styling that weakens the premium editorial golf brand.

## Questions to ask

- Does a component or token for this already exist?
- Does this really need `"use client"`?
- What happens at 375px? With long content? With keyboard only?
- Is important marketing copy server rendered?

## Checks

- Run the [review](../quality-gates/review-checklist.md) and [accessibility](../quality-gates/accessibility-checklist.md) checklists.
- No console or hydration errors.
- Images use `next/image` with correct dimensions and alt text.

## Common mistakes to avoid

- One oversized page component instead of composable sections.
- Client-fetching content that should be static.
- Adding a dependency for something Tailwind/CSS/React already does.
- Divs where buttons, nav, lists or headings belong.
