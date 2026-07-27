# 13. Module Maturity Gate

Cite this document rather than restating the tier definitions or promotion criteria elsewhere. It supersedes [ADR-0008](../adr/0008-module-maturity-gate.md)'s own description for implementation purposes; the ADR remains the record of why this gate exists.

## 13.1 The concern

Nuvia has ten modules (Section 1.3, Section 5). Five are wired to real data; six render from hardcoded mock arrays. Shipping every module enabled by default means an association hits a full dashboard section that quietly does nothing — not an unfinished feature from a user's perspective, but a broken one. This concern applies to every module that has UI before it has a real backend, which given `docs/PRINCIPLES.md`'s "easy to customize" principle (build UI against mock data as a valid starting point) will recur.

## 13.2 Decision matrix

| Concern               | Decision                                                                     | Rationale                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Tier count            | Four: Mock, Backed, Tested, Promoted                                         | Matches the criteria that actually gate a real launch: schema, API+authz, tests, docs                                         |
| Mock -> Backed        | Real Drizzle schema exists, an authorized API exists, UI is wired to it      | "Wired" means the UI no longer imports `src/lib/data/mock-*.ts` for this module                                               |
| Backed -> Tested      | Same as Backed, plus the module's test coverage from `TODO.md` M2's standard | No partial credit; missing tests keeps a module at Backed                                                                     |
| Tested -> Promoted    | Same as Tested, plus documentation                                           | Flag flips to `true` only at Promoted; there is no intermediate "half-on" state                                               |
| Default flag state    | `false` for every module below Promoted                                      | A module with tests but no docs, or an API with no authz check, stays off by default                                          |
| Registry location     | `config/features.ts`                                                         | Not yet created; see 13.5                                                                                                     |
| Mock code disposition | Kept, not deleted                                                            | Deleting built UI to satisfy an abstract cleanliness preference is pure waste; it is a real head start on the eventual module |

## 13.3 Interface / registry shape (planned, not yet built)

```ts
// config/features.ts (does not exist yet — this is the target shape)
export const MODULE_FLAGS: Record<ModuleName, boolean> = {
  members: true,
  events: true,
  content: true,
  forums: true,
  jobs: true,
  finance: false,
  awards: false,
  learning: false,
  chapters: false,
  committees: false,
  workspaces: false,
};
```

## 13.4 Promotion order

By value to an association, per `TODO.md` M3: finance/dues, then chapters, then committees, then learning/CPD, then awards, then workspaces. Finance is first because dues billing is the product for an AMS; a payment-provider ADR is a prerequisite (Section 5.6) before any wiring begins.

## 13.5 Current state (as of this document)

**The gate is not implemented.** `config/features.ts` does not exist. This is a narrower gap than "unrestricted," though: the six Mock modules are still role-gated the same as every other dashboard section (Section 2.4) — `src/proxy.ts` calling `isRoleAllowedForPath` against `src/lib/navigation-data.ts` still applies. What is missing is a maturity flag independent of role. A user whose role permits a Mock module's section (which ranges from admin-only to any member, depending on the module) sees a fully mock UI with no real schema behind it, with nothing in the UI marking it as such.

## 13.6 What this does NOT do

- It does not gate by role. Role-based dashboard access (Section 2.4) is a separate, already-enforced mechanism; the maturity gate is orthogonal to it.
- It does not delete or hide the mock UI's source code. Only its default visibility to an end user changes at promotion.
- It does not require multi-tenancy. The gate applies per-deployment (every `Organization` row on a given install shares the same `MODULE_FLAGS`), not per-association within a future multi-tenant deployment.

## 13.7 Cross-references

| Concern                                       | Source                                                    |
| --------------------------------------------- | --------------------------------------------------------- |
| Full ADR reasoning                            | [ADR-0008](../adr/0008-module-maturity-gate.md)           |
| Single-association tenant seam                | [ADR-0007](../adr/0007-single-association-tenant-seam.md) |
| Dashboard role gate (separate mechanism)      | Section 2.4                                               |
| Finance module's current mock state           | Section 5.6                                               |
| WCAG conformance scope (enabled modules only) | Section 8, `TODO.md` M4                                   |

## 13.8 Open follow-ups

- Build `config/features.ts` and wire the dashboard nav, route registration, and page rendering to read it. This is `TODO.md` M3's "Module promotion gate" item, currently unchecked.
- Decide whether `config/features.ts` is a static file, an environment-variable-driven map, or a database-backed setting on `organizations.settings` before implementing — this document does not make that call, since it changes whether a deployer can flip a flag without a redeploy.
