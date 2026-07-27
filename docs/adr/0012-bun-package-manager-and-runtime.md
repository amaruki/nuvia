# ADR-0012: Bun as the canonical package manager and runtime

**Status:** Accepted, implemented

## Context

The repo had a `bun.lock` file, but `package.json`'s own scripts called `npm` (`"db:reset": "prisma migrate reset --force && npm run db:seed"`). The README also mixed `bun`, `bunx`, and `npm` commands inconsistently. Separately, `npm audit` cannot run at all against a Bun-only lockfile (`ENOLOCK` — it requires `package-lock.json`). This meant there was **no working vulnerability-scanning path** before this decision.

## Decision

Bun is canonical for both package management and the JavaScript runtime:

- `bun.lock` is the only lockfile. No `package-lock.json` exists.
- Every `package.json` script uses `bun` or `bunx`. `db:seed` runs the TypeScript seed script directly via Bun, since Bun executes TypeScript natively. `tsx` and `ts-node` are not needed, and both packages are removed.
- `bun audit` is the vulnerability scanner (see `docs/supply-chain.md`).
- `bun test` is the test runner (`TODO.md` M2). It has a Jest-compatible API and zero additional dependency.
- CI uses `oven-sh/setup-bun`. The eventual Docker base image is `oven/bun`.

## Open question, carried forward rather than assumed

It is unverified whether Next.js 16 runs reliably **as a Bun-runtime process** (`bun --bun next build && bun --bun next start`). The alternative is that Bun only manages packages while Node executes Next.js. This environment had no way to run a full cycle of `next build` followed by `next start`, end-to-end. The `dev`, `build`, and `start` scripts in `package.json` currently invoke `next` directly. Bun's Node-compatibility layer or a plain Node runtime, whichever the environment resolves to, handles execution instead. The scripts do not force the `--bun` flag. Flip that flag only after someone verifies that it works in a real environment. Until then, treat "Bun as package manager, Node (or Bun's Node-compat mode) as the JS runtime for Next itself" as the safe default.

## Consequences

- `bun audit --prod` becomes part of `guard:heavy` (`package.json`) and the CI gate.
- The removal of `bcrypt` (a native node-gyp module, replaced by better-auth's own hashing — verified unused in `src/` before removal) is both a supply-chain simplification and a Bun-portability improvement. Native modules are the most common source of runtime-specific breakage.
