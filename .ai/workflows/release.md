# Workflow: Release

**Triggered only by the user explicitly saying `Release`** (or explicitly instructing a commit/push/deploy for a specific task). Nothing in the default workflows commits, merges, pushes or deploys.

1. **Confirm agreed scope** — what is being released matches what was reported and approved.
2. **Confirm no critical unresolved issue remains** from review or verification.
3. **Run the full [release gate](../quality-gates/release-checklist.md)** — lint, tests, build, docs, links, environment notes.
4. **Update documentation** — `CLAUDE.md`, skills, arc42, README as affected.
5. **Create an appropriate branch if needed** (see [branch naming](../skills/github-issues.md)).
6. **Commit with a clear message** describing the change, not the process.
7. **Push only if authorised** — "Release" covers commit and push of the agreed scope; confirm anything beyond it.
8. **Open or update a pull request if requested**, using the PR template.
9. **Include `Closes #...`** for completed issues.
10. **Report deployment status honestly.** Verify the deployment (load the URL, exercise the changed journey) before describing it as live. **Never claim deployment unless verified.**
