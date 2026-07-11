# Skill: Operations

> **Status: partially planned.** The repo has no code and is not yet connected to Vercel. Update each section as facts are established.

## Local setup

- Node: current LTS (record the exact version in `.nvmrc` / `package.json engines` at scaffold time and update here).
- Package manager: npm.
- Setup once code exists: `npm install`, then `npm run dev`.

## Repository

- Remote: `git@github.com:simplesimondoes/buymeatee.git` (GitHub: `simplesimondoes/buymeatee`), default branch `main`.
- Work happens locally and pauses before commit/push — see the [release workflow](../workflows/release.md).

## Deployment (planned)

- Vercel, connected to the GitHub repo: previews per PR, production from `main`.
- Production domain: `https://buymeatee.com` — DNS/domain configuration on Vercel to be documented here once done.
- Record the Vercel project URL in [.ai/context/links.md](../context/links.md) when created.

## Environment variables

Documented in `.env.example` once the app exists. Currently agreed:

```env
NEXT_PUBLIC_SITE_URL=https://buymeatee.com
EARLY_ACCESS_API_URL=
```

`NEXT_PUBLIC_*` values are public by definition — nothing secret goes there. Server-side secrets are set in Vercel project settings, never committed.

## Preview expectations

Every visual change verified in a running app at 375 / 768 / 1024 / 1440px before reporting. Once Vercel is connected, PR preview URLs are the verification surface for release.

## Release verification and rollback

After any production deploy: load `buymeatee.com`, check the changed journey, check console for errors. Rollback: Vercel's instant rollback to a previous deployment ("Promote to Production" on a prior build) — document specifics after first deploy.
