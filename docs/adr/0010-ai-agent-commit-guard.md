# ADR-0010: AI-agent commit guard

**Status:** Accepted. Local hooks are implemented. GitHub branch protection is deferred.

## Context

220 commits landed on `main` directly over roughly six weeks before this ADR. No branches, no PRs, and no review existed. This pace is consistent with AI-assisted development. Unreviewed velocity is exactly how a codebase accumulates the kind of drift that this whole effort exists to reverse (three authorization helpers, three response factories, four rate limiters — see ADR-0001 through ADR-0003). An AI agent that works on this repo in the future, with no guardrail, can add a fourth of each.

## Decision

**Local git hooks (lefthook), applied identically to every contributor — human or AI — the moment they clone the repo:**

- The `pre-commit` hook in `lefthook.yml` runs `oxlint` and `oxfmt --check` on staged files. It blocks the commit on failure. This behavior is verified: it blocked this session's own first commit attempt for unformatted files.
- The `commit-msg` hook runs `commitlint`, which enforces Conventional Commits. A second job in this hook rejects any commit whose message contains a `Co-Authored-By:` trailer, from a human or an AI.
- The `pre-push` hook runs `bun run typecheck` and `bun run test:unit`
  (the infra-free unit suite; see the 2026-08-10 addendum below for why the
  integration suite moved out of pre-push).

**This ADR explicitly does not configure GitHub branch protection (a pull request, a review, and status checks required before merge to `main`).** Branch protection is the single mechanism that can actually prevent a repeat of the "220 commits straight to main" pattern. However, a change to real repository settings on a live GitHub remote is an outward-facing, semi-irreversible action. This action needs the repository owner's explicit go-ahead, not an agent's unilateral call. This ADR records branch protection here as the clear next step. This ADR does not silently skip it.

## Why local hooks and not just a documented policy

A policy that says "run the linter before a commit" is exactly the kind of prose rule that rots. See the anti-drift design that runs through every ADR in this set. A hook that physically blocks the commit is the same enforcement principle applied to process instead of code.

## Consequences

- `CONTRIBUTING.md` documents these hooks as the actual mechanism, not a suggestion. The claim "hooks run automatically via the `prepare` script in `bun install`" is stronger than "please lint your code."
- Once GitHub branch protection is configured (an owner decision), CI (`bun run guard:heavy`, `TODO.md` M2) becomes the second, server-side layer of the same guard. Local hooks catch problems before push. CI catches anything that a contributor bypassed locally. A contributor can always run `--no-verify` locally. CI exists for exactly that case.

## Addendum 2026-08-10: pre-push runs the unit suite; CI enforces the rest

The original design ran `bun run test:integration` in pre-push. In practice
that made every push cost a docker stack boot plus a full database suite
(tens of seconds to minutes), so agents and humans alike started pushing with
`--no-verify` — defeating the guard this ADR exists to provide. A hook people
routinely bypass enforces nothing.

The test suite was therefore split:

- `tests/unit/` (`bun run test:unit`) is infra-free — no docker, no network —
  and runs in seconds. pre-push and `guard:light` run it, so the local guard
  is fast enough that bypassing it buys nothing.
- The integration suite, the Playwright WCAG 2.2 AA audit (`test:a11y`), and
  the route-boot smoke (`test:smoke`) run in CI (the `heavy` and `browser`
  jobs of `.github/workflows/ci.yml`). CI was already the layer this ADR
  designates for anything bypassed locally; it now also carries the slow
  suites outright.

The enforcement principle is unchanged: every push is checked locally, and CI
is the server-side backstop. What changed is which checks run where, so that
the local checks are ones contributors will actually let run.
