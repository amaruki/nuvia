# ADR-0008: Module maturity levels and the promotion gate

**Status:** Accepted, not yet implemented (tracked in `TODO.md` M3)

## Context

104 `page.tsx` files exist. Only 5 domains (members, events, content, forums, jobs) have a backing Drizzle schema and any real API. The other ~16 UI "modules" (finance, awards, learning, chapters, committees, workspaces, and others) are React components. These components render from `src/lib/data/mock-*.ts` — ~226 KB of hardcoded arrays across 14 files. Zero payment or storage SDKs exist to back the two most-mocked categories.

If all 104 pages ship by default, an association that installs this software hits a full "Budget" or "Awards" dashboard. This dashboard quietly does nothing when the association tries to use it. This behavior is not an unfinished feature from a user's perspective. It is a broken one.

## Decision

Introduce a **module maturity flag registry** (`config/features.ts`, `TODO.md` M3), with four tiers per module:

1. **Mock** — UI only, backed by `src/lib/data/mock-*`. Flag: `false`.
2. **Backed** — a real Drizzle schema and an authorized API exist. The UI is wired to them, but test and documentation coverage is incomplete. Flag: `false`.
3. **Tested** — same as Backed, plus the test coverage that `TODO.md` M2 describes for that domain. Flag: still `false` until documentation lands.
4. **Promoted** — schema, API, authorization, tests, and documentation are all present. Flag: `true`. The module ships enabled by default.

A module reaches tier 4 (flag flipped to `true`) only when all five criteria are met. There is no partial credit. A module with tests but no documentation, or an API with no authorization check, stays off by default.

Today, the default install enables **members, events, content, forums, jobs**. It disables **finance, awards, learning, chapters, committees, workspaces**. The promotion order, ranked by value to an association (see `TODO.md` M3), is finance/dues, then chapters, then committees, then learning/CPD, then awards, then workspaces.

## Consequences

- The mock UI code is **kept**, not deleted. It is a real head start on the eventual real module. Deletion of 226 KB of built UI to satisfy an abstract "cleanliness" preference is pure waste. The code is simply not shown to users who have not opted into it.
- A contributor who builds out a module has an unambiguous, checkable definition of "done" instead of "looks done." This is the same discipline that ADR-0001 through ADR-0006 apply to code. This ADR applies that discipline to features.
- The controls mapping in `docs/security/controls.md` and the WCAG pass in `TODO.md` M4 only need to cover **enabled** modules for 1.0. This materially shrinks the compliance surface. It does not lower the bar for what is actually shipped.
