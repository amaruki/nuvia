# Pull request

<!--
One concern per PR, the same discipline as commits (CONTRIBUTING.md).
The checklist below mirrors the enforcement you already hit locally from
lefthook.yml plus the review bar in CONTRIBUTING.md — it does not add
new rules. If a box cannot be ticked, say why in the description instead
of routing around the check.
-->

## Summary

<!-- What this PR changes and why, in one to three sentences. -->

## Linked issue / backlog item

<!--
Reference the TODO.md item, GitHub issue, or planning backlog ID this PR
addresses. Planning backlog IDs are the stable A1…F4 identifiers in
docs/planning/01-todo-backlog.md (for example: E5). Write "none" only for
a trivial fix with no tracked item.
-->

Closes #

## Checklist

- [ ] Commit titles follow Conventional Commits: `<type>(<scope>): <subject>`, imperative mood, under 80 characters. Allowed types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `build`, `revert` (commitlint.config.ts).
- [ ] No `Co-Authored-By:` trailer in any commit — the commit-msg hook hard-blocks it, identically for humans and AI agents.
- [ ] The PR is scoped to one concern. A dependency bump, the fallout it causes, and an unrelated formatting pass are three commits (or PRs), not one.
- [ ] Tests added or updated for every behavior change, and `bun run guard:heavy` passes locally before opening this PR.
- [ ] Nothing was committed with `--no-verify`. If a hook check seemed wrong, the fix for the check landed as its own separate commit.
- [ ] Docs updated wherever a claim about the system changed — README.md, `docs/`, code comments, and CHANGELOG.md's `[Unreleased]` section.
- [ ] `docs/adr/README.md` was checked first: existing decisions are matched, not re-opened. If this PR introduces a new pattern, the need for a new ADR is called out in the description.
- [ ] New dependencies, if any, are added at an exact pinned version (no `^`/`~`) and bumped in their own commit.

## Claims vs reality

<!--
Repo standard (CLAUDE.md, "What 'done' means"): every claim this PR makes
about what the system does or does not do — in this description, in commit
messages, in docs, or in code comments — must be verified against the
actual code, not assumed from an earlier finding.

List each claim and where you verified it (file:line or test name). If
something is only partially done, or a claim turned out to be wrong, say
so plainly here and correct it in the PR — the transparency principle
(docs/PRINCIPLES.md) requires saying what is true, even when unflattering.
-->

| Claim | Verified against |
| ----- | ---------------- |
|       |                  |
