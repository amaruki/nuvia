# Contributing to Nuvia

Thank you for considering a contribution. This document is the practical "how". `CODING_STANDARD.md` is the rules, and `docs/adr/` is the "why" behind the contested ones.

## Before you start

1. Check [`TODO.md`](TODO.md) first. It might already list your idea, with constraints you should know before you start work. Items with the label **good first issue** are deliberately small and well-bounded.
2. Check [`docs/adr/README.md`](docs/adr/README.md) first. If your change touches an existing decision (for example, the authorization helper, error shape, or ORM), match it. Do not add a new alternative.
3. For anything not already scoped, open an issue that describes the change before you write a large PR. This avoids a finished PR that does not fit the project's direction.

## Setup

```bash
git clone https://github.com/amaruki/nuvia.git
cd nuvia
bun install   # also installs git hooks — see below
cp .env.example .env.local
# fill in DATABASE_URL, BETTER_AUTH_SECRET at minimum
bun run db:generate && bun run db:push
SEED_ADMIN_PASSWORD='Your-Strong-Passw0rd' bun run db:seed   # remember it — you sign in with it
bun run dev
```

Sign in at `/auth/login` with any seeded account (for example `admin@nuvia.com`)
and the password you passed as `SEED_ADMIN_PASSWORD`.

## The enforcement you will actually hit

Install Docker with Docker Compose before you run the integration tests.

`bun install` installs [lefthook](https://lefthook.dev)'s git hooks automatically (`docs/adr/0010-ai-agent-commit-guard.md`). You do not configure the hooks:

- **pre-commit**: `oxlint` and `oxfmt --check` on staged files. A failing check blocks the commit. Fix the code (`bun run lint:fix`, `bun run format`). Do not bypass it with `--no-verify`.
- **commit-msg**: Conventional Commits format, with a hard block on any `Co-Authored-By:` trailer. This rule applies identically whether you are a human or an AI agent working in this repo.
- **pre-push**: `bun run typecheck` and `bun run test:integration`.

Run `bun run guard:heavy` locally before you open a PR. The integration test command starts an isolated PostgreSQL and Redis stack.

The formatting standard is pinned in `.oxfmtrc.json`, so `oxfmt` formats identically on every machine and every oxfmt version. Do not run `oxfmt --init` or change the pinned options casually; the pre-commit gate enforces exactly this configuration.

## Commit messages

Use the format `<type>(<scope>): <subject>`, in the imperative mood, under 80 characters. Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `build`, `revert`. Keep one logical concern in each commit. See the Drizzle migration's commit history for the pattern. It landed the ORM migration, the dependency-bump fallout, and a formatting pass as three separate commits, not one.

## Pull requests

- Keep pull requests scoped to one concern, the same discipline as commits above.
- Reference the `TODO.md` item or issue it addresses.
- Confirm that `bun run guard:heavy` passes locally before you open the pull request.
- Once branch protection is configured (`docs/adr/0010`), it requires CI checks and one human review before merge. Until branch protection is configured, treat that bar as the expectation anyway.

## Code review

There is no formal checklist yet beyond `CODING_STANDARD.md` and the ADRs. A reviewer's first question for a new pattern should be: does an ADR already answer this? If yes, match the ADR. If not, that is a signal that the project might need a new ADR, not a signal that anything is acceptable.

## Reporting a security issue

Do not open a public issue. See [`SECURITY.md`](SECURITY.md).

## Code of conduct

See [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
