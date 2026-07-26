# ADR-0013: oxlint + oxfmt replace ESLint + Prettier

**Status:** Accepted, implemented

## Context

The prior ESLint config (`eslint.config.mjs`) downgraded
`@typescript-eslint/no-explicit-any`, `no-unused-vars`,
`no-empty-object-type`, `react/no-unescaped-entities`, and
`@next/next/no-img-element` to `"warn"` — meaning nothing actually blocked
a build. No Prettier config existed at all.

## Decision

`oxlint` (1.75.0) replaces ESLint; `oxfmt` (0.60.0) replaces Prettier.
Verified before adopting, not assumed:

- **844 total rules, 113 on by default**, including everything the
  anti-drift design in ADR-0001 through ADR-0006 depends on:
  `no-restricted-imports` (restriction category — makes a deleted helper
  physically unimportable, with a custom message), `no-console` (ADR-0004),
  30+ `jsx-a11y` rules (WCAG 2.2 AA, `TODO.md` M4), 16+ `nextjs` rules
  (replacing `eslint-config-next`), 100+ TypeScript rules including
  type-aware ones (`no-floating-promises`) via the optional
  `oxlint-tsgolint` package.
- **oxfmt is idempotent** — verified directly (checksum-stable across
  repeated runs on the same file) after an initial scare where a stale
  `git diff` comparison (against an outdated staged version, not the actual
  on-disk state) looked like non-determinism and wasn't.

Known, tolerable gaps, both open upstream issues:
`no-restricted-imports` config doesn't merge across folder-level overrides
([oxc-project/oxc#12179](https://github.com/oxc-project/oxc/issues/12179))
and side-effect imports can escape regex patterns
([#19956](https://github.com/oxc-project/oxc/issues/19956)). Neither
affects the flat, repo-root config this project uses. Architecture-boundary
enforcement (which layer may import which) uses `dependency-cruiser`
instead of lint config, specifically because of the first gap.

## Consequences

- `oxfmt` is **pre-1.0** (0.60.0). Low risk in practice — a formatter only
  rewrites whitespace/quoting and its output is directly verifiable — but
  pinned to an exact version (ADR-0012's pinning policy) rather than
  floated, and noted here for anyone assessing toolchain maturity.
- Migration was a clean cutover, not a parallel-run — the prior ESLint
  config's `"warn"`-everywhere state meant there was nothing load-bearing
  to preserve compatibility with.
- The 164 pre-existing `any` usages and 301 `console.*` calls are not fixed
  by adopting oxlint alone; `no-explicit-any` and `no-console` are enabled
  as a **ratchet** (baseline the current count, fail only on increase) per
  ADR-0004 and `TODO.md`, not a big-bang fix.
