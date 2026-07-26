# ADR-0012: Bun as the canonical package manager and runtime

**Status:** Accepted, implemented

## Context

The repo had a `bun.lock` file but `package.json`'s own scripts called
`npm` (`"db:reset": "prisma migrate reset --force && npm run db:seed"`),
and the README mixed `bun`, `bunx`, and `npm` commands inconsistently.
Separately: `npm audit` cannot run at all against a Bun-only lockfile
(`ENOLOCK` — it requires `package-lock.json`), meaning there was **no
working vulnerability-scanning path** before this decision.

## Decision

Bun is canonical for both package management and the JavaScript runtime:

- `bun.lock` is the only lockfile; no `package-lock.json`.
- Every `package.json` script uses `bun`/`bunx` (`db:seed` runs the
  TypeScript seed script directly via Bun — no `tsx`/`ts-node` needed,
  since Bun executes TypeScript natively; both packages are removed).
- `bun audit` is the vulnerability scanner (see `docs/supply-chain.md`).
- `bun test` is the test runner (`TODO.md` M2) — Jest-compatible API, zero
  additional dependency.
- CI uses `oven-sh/setup-bun`; the eventual Docker base image is
  `oven/bun`.

## Open question, carried forward rather than assumed

Whether Next.js 16 runs reliably **as a Bun-runtime process**
(`bun --bun next build && bun --bun next start`), as opposed to Bun merely
managing packages while Node executes Next.js, is unverified — this
environment had no way to run a full `next build`/`next start` cycle
end-to-end. `package.json`'s `dev`/`build`/`start` scripts currently invoke
`next` directly (letting Bun's Node-compatibility layer or a plain Node
runtime handle execution, whichever the environment resolves to) rather
than forcing `--bun`. Flip that flag only after someone verifies it works
in a real environment; until then, treat "Bun as package manager, Node (or
Bun's Node-compat mode) as the JS runtime for Next itself" as the safe
default.

## Consequences

- `bun audit --prod` becomes part of `guard:heavy` (`package.json`) and the
  CI gate.
- Removing `bcrypt` (a native node-gyp module, replaced by better-auth's
  own hashing — verified unused in `src/` before removal) is both a
  supply-chain simplification and a Bun-portability improvement, since
  native modules are the most common source of runtime-specific breakage.
