# ADR-0010: AI-agent commit guard

**Status:** Accepted, local hooks implemented; GitHub branch protection deferred

## Context

220 commits landed on `main` directly over roughly six weeks before this
ADR — no branches, no PRs, no review, at a pace consistent with
AI-assisted development. Unreviewed velocity is exactly how a codebase
accumulates the kind of drift this whole effort exists to reverse (three
authorization helpers, three response factories, four rate limiters — see
ADR-0001 through ADR-0003). An AI agent working on this repo in the future,
with no guardrail, is just as capable of adding a fourth of each.

## Decision

**Local git hooks (lefthook), applied identically to every contributor —
human or AI — the moment they clone the repo:**

- `lefthook.yml`'s `pre-commit`: `oxlint` and `oxfmt --check` on staged
  files. Blocks the commit on failure — verified working (it blocked this
  session's own first commit attempt for unformatted files).
- `commit-msg`: `commitlint` enforces Conventional Commits; a second job
  rejects any commit whose message contains a `Co-Authored-By:` trailer,
  human or AI.
- `pre-push`: `bun run typecheck` and `bun test`.

**GitHub branch protection (require PR + review + status checks before
merge to `main`) is explicitly _not_ configured by this ADR.** It's the
single mechanism that would actually stop the "220 commits straight to
main" pattern from recurring, but changing real repository settings on a
live GitHub remote is an outward-facing, semi-irreversible action that
needs the repository owner's explicit go-ahead, not an agent's unilateral
call. It's recorded here as the clear next step, not silently skipped.

## Why local hooks and not just a documented policy

A policy that says "run the linter before committing" is exactly the kind
of prose rule that rots — see the anti-drift design running through every
ADR in this set. A hook that physically blocks the commit is the same
enforcement principle applied to process instead of code.

## Consequences

- `CONTRIBUTING.md` documents this as the actual mechanism, not a
  suggestion — "hooks run automatically via `bun install`'s `prepare`
  script" is a stronger claim than "please lint your code."
- Once GitHub branch protection is configured (owner's call), CI
  (`bun run guard:heavy`, `TODO.md` M2) becomes the second, server-side
  layer of the same guard — local hooks catch problems before push; CI
  catches anything a contributor bypassed locally (`--no-verify` is always
  possible; that's what CI is for).
