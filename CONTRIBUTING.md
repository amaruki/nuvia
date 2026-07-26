# Contributing to Nuvia

Thanks for considering it.
This document is the practical "how"; `CODING_STANDARD.md` is the rules,
and `docs/adr/` is the "why" behind the contested ones.

## Before you start

1. Check [`TODO.md`](TODO.md) — your idea may already be scoped there, with
   constraints worth knowing before you write code.
   Items tagged **good first issue** are deliberately small and
   well-bounded.
2. Check [`docs/adr/README.md`](docs/adr/README.md) — if the thing you're
   about to build touches a decision already made (which authorization
   helper, which error shape, which ORM), match it rather than introducing
   an alternative.
3. For anything not already scoped, open an issue describing the change
   before writing a large PR — this avoids the disappointment of a finished
   PR that doesn't fit the project's direction.

## Setup

```bash
git clone https://github.com/amaruki/nuvia.git
cd nuvia
bun install   # also installs git hooks — see below
cp .env.example .env.local
# fill in DATABASE_URL, BETTER_AUTH_SECRET at minimum
bun run db:generate && bun run db:push
SEED_ADMIN_PASSWORD=$(openssl rand -base64 24) bun run db:seed
bun run dev
```

## The enforcement you'll actually hit

`bun install` installs [lefthook](https://lefthook.dev)'s git hooks
automatically (`docs/adr/0010-ai-agent-commit-guard.md`) — you don't
configure this yourself:

- **pre-commit**: `oxlint` and `oxfmt --check` on staged files.
  A failing check blocks the commit.
  Fix the code (`bun run lint:fix`, `bun run format`), don't bypass with
  `--no-verify`.
- **commit-msg**: Conventional Commits format, and a hard block on any
  `Co-Authored-By:` trailer — this applies identically whether you're a
  human or an AI agent working in this repo.
- **pre-push**: `bun run typecheck` and `bun test`.

Run `bun run guard:heavy` locally before opening a PR — it's what CI runs.

## Commit messages

`<type>(<scope>): <subject>`, imperative mood, under 80 characters.
Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`,
`build`, `revert`.
One logical concern per commit — see the Drizzle migration's commit
history for the pattern (ORM migration, dependency-bump fallout, and a
formatting pass landed as three separate commits, not one).

## Pull requests

- Keep them scoped to one concern, matching the commit discipline above.
- Reference the `TODO.md` item or issue it addresses.
- `bun run guard:heavy` passes locally before you open it.
- Once branch protection is configured (`docs/adr/0010`), CI + one human
  review are required before merge — until then, treat that bar as the
  expectation anyway.

## Code review

There's no formal checklist yet beyond `CODING_STANDARD.md` and the ADRs.
A reviewer's first question for a new pattern should be "does an ADR
already answer this?" — if yes, match it; if genuinely not, that's a signal
a new ADR might be needed, not that anything goes.

## Reporting a security issue

Do not open a public issue.
See [`SECURITY.md`](SECURITY.md).

## Code of conduct

See [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
