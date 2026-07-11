# Quality Gate: Release

Run only within the [release workflow](../workflows/release.md).

- [ ] Scope is complete and matches what was approved.
- [ ] Critical review/verification findings are resolved.
- [ ] Lint passes.
- [ ] Tests pass.
- [ ] Production build passes.
- [ ] Documentation is current (CLAUDE.md, skills, arc42, README).
- [ ] Environment changes are documented (`.env.example`, operations skill, Vercel settings noted).
- [ ] Legal placeholders remain clearly marked for legal review.
- [ ] Links work (internal navigation, footer, blog cross-links).
- [ ] Production assumptions are explicit (domain, env vars, external services).
- [ ] **The user explicitly instructed release.**
