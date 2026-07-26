# ADR-0008: Module maturity levels and the promotion gate

**Status:** Accepted, not yet implemented (tracked in `TODO.md` M3)

## Context

104 `page.tsx` files exist; only 5 domains (members, events, content,
forums, jobs) have a backing Drizzle schema and any real API. The other
~16 UI "modules" (finance, awards, learning, chapters, committees,
workspaces, and others) are React components rendering from
`src/lib/data/mock-*.ts` — ~226 KB of hardcoded arrays across 14 files, with
zero payment or storage SDKs installed to back the two most-mocked
categories.

Shipping all 104 pages by default means an association installing this
software hits a full "Budget" or "Awards" dashboard that quietly does
nothing when they try to use it. That is not an unfinished feature from a
user's perspective — it is a broken one.

## Decision

Introduce a **module maturity flag registry**
(`config/features.ts`, `TODO.md` M3), with four tiers per module:

1. **Mock** — UI only, `src/lib/data/mock-*` backed. Flag: `false`.
2. **Backed** — real Drizzle schema + authorized API exist, UI is wired to
   them, but coverage (tests, docs) is incomplete. Flag: `false`.
3. **Tested** — same as Backed, plus the test coverage `TODO.md` M2
   describes for that domain. Flag: still `false` until docs land.
4. **Promoted** — schema + API + authz + tests + docs, all present. Flag:
   `true`, module ships enabled by default.

A module only reaches tier 4 — flag flipped to `true` — when all five
criteria are met. There is no partial credit; a module with tests but no
docs, or an API with no authz check, stays off by default.

Default install today: **members, events, content, forums, jobs** enabled;
**finance, awards, learning, chapters, committees, workspaces** disabled.
Promotion order, by value to an association (see `TODO.md` M3): finance/dues
→ chapters → committees → learning/CPD → awards → workspaces.

## Consequences

- The mock UI code is **kept**, not deleted — it's a real head start on the
  eventual real module, and deleting 226 KB of built UI to satisfy an
  abstract "cleanliness" preference would be pure waste. It's just not
  shown to users who haven't opted into it.
- A contributor building out a module has an unambiguous, checkable
  definition of "done" instead of "looks done" — this is the same
  discipline ADR-0001 through ADR-0006 apply to code; this ADR applies it
  to features.
- The controls mapping in `docs/security/controls.md` and the WCAG pass in
  `TODO.md` M4 only need to cover **enabled** modules for 1.0 — this
  materially shrinks the compliance surface without lowering the bar for
  what's actually shipped.
