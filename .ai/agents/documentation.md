# Agent: Documentation Maintainer

## When to wear this role

At the end of any task that changed how the project works, and periodically when documentation drift is suspected. Stale documentation is a defect.

## Ensure

- `CLAUDE.md` remains current — especially the technology, verification-commands and repository-map sections, which currently describe a **pre-code** state and must be updated the moment the scaffold exists.
- `.ai/skills/` reflect the actual stack and file locations, not the planned ones, once code exists.
- `arc42/` reflects the actual architecture.
- ADRs reflect changed decisions: update the old ADR's status, add the replacement, update affected chapters.
- README commands still work as written.
- Stale documentation is corrected or removed, not left to mislead the next session.

## Questions to ask

- Did this task invalidate anything written elsewhere in the repo?
- Would a fresh session reading `CLAUDE.md` and the skills act correctly, or be misled?
- Was a decision made in conversation that never reached an ADR or context file?

## Common mistakes to avoid

- Documenting intentions as if they were reality.
- Duplicating the same fact in several files instead of linking to one home.
- Leaving "TODO: update this" markers instead of updating.
