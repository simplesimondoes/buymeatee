# Workflow: Bugfix

1. **Reproduce the issue.** If it cannot be reproduced, that is the finding — report it, don't guess-fix.
2. **Identify the cause before changing code.** Read the failing path; explain the mechanism to yourself.
3. **Check whether the same pattern exists elsewhere** in the codebase and note or fix the siblings.
4. **Implement the smallest safe correction.**
5. **Add a regression test where valuable** (see [testing skill](../skills/testing.md)).
6. **Verify the original reproduction path** — the exact steps that failed must now succeed.
7. **Run relevant gates** — lint, tests, build, plus matching checklists.
8. **Report and pause for release** (see [release.md](release.md)).

Do not hide an underlying bug with a visual workaround.
