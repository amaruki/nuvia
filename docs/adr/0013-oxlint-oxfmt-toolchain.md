# ADR-0013: oxlint + oxfmt replace ESLint + Prettier

**Status:** Accepted, implemented

## Context

The prior ESLint config (`eslint.config.mjs`) downgraded `@typescript-eslint/no-explicit-any`, `no-unused-vars`, `no-empty-object-type`, `react/no-unescaped-entities`, and `@next/next/no-img-element` to `"warn"`. This meant that nothing actually blocked a build. No Prettier config existed at all.

## Decision

`oxlint` (1.75.0) replaces ESLint. `oxfmt` (0.60.0) replaces Prettier. The team verified this choice before adoption, rather than assuming it:

- **844 total rules, 113 on by default**, including everything that the anti-drift design in ADR-0001 through ADR-0006 depends on:
  - `no-restricted-imports` (restriction category — makes a deleted helper physically unimportable, with a custom message)
  - `no-console` (ADR-0004)
  - 30+ `jsx-a11y` rules (WCAG 2.2 AA, `TODO.md` M4)
  - 16+ `nextjs` rules (which replace `eslint-config-next`)
  - 100+ TypeScript rules, including type-aware ones (`no-floating-promises`) via the optional `oxlint-tsgolint` package
- **oxfmt is idempotent.** The team verified this directly: output is checksum-stable across repeated runs on the same file. This came after an initial scare, where a stale `git diff` comparison (against an outdated staged version, not the actual on-disk state) looked like non-determinism, but was not actually non-determinism.

Known, tolerable gaps exist, both open upstream issues. `no-restricted-imports` config does not merge across folder-level overrides ([oxc-project/oxc#12179](https://github.com/oxc-project/oxc/issues/12179)). Side-effect imports can also escape regex patterns ([#19956](https://github.com/oxc-project/oxc/issues/19956)). Neither gap affects the flat, repo-root config that this project uses. Architecture-boundary enforcement (which layer may import which) uses `dependency-cruiser` instead of lint config, specifically because of the first gap.

## Consequences

- `oxfmt` is **pre-1.0** (0.60.0). This is low risk in practice: a formatter only rewrites whitespace and quoting, and its output is directly verifiable. However, `oxfmt` is pinned to an exact version (ADR-0012's pinning policy) rather than floated. This ADR notes that here for anyone who assesses toolchain maturity.
- Migration was a clean cutover, not a parallel run. The prior ESLint config's `"warn"`-everywhere state meant there was no load-bearing behavior to preserve.
- Oxlint alone does not fix the 164 pre-existing `any` usages and 301 `console.*` calls. `no-explicit-any` and `no-console` are enabled as a **ratchet** (baseline the current count, fail only on increase) per ADR-0004 and `TODO.md`. This is not a big-bang fix.
