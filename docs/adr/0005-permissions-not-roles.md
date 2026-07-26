# ADR-0005: Permissions, not role arrays, as the authorization vocabulary

**Status:** Accepted, not yet implemented (tracked in `TODO.md` M1)

## Context

Two authorization vocabularies coexist:

- The server: `` `${module}:${action}` `` permissions
  (`src/types/role.types.ts`, e.g. `'events:publish'`), resolved per role via
  `ROLE_PERMISSIONS` and checked with `requirePermission` (ADR-0001).
- The UI nav: `roles?: UserRole[]` arrays
  (`src/components/dashboard/layout/navigation-config.tsx:58`), e.g.
  `roles: ["admin", "superadmin"]`.

Neither derives from the other. A role gains a permission in
`ROLE_PERMISSIONS` and the nav doesn't reflect it (or vice versa) unless
someone remembers to update both, by hand, in two different files with two
different shapes.

## Decision

The permission model (`` `${module}:${action}` ``) is the single source of
truth. Nav visibility is derived from it: each nav entry declares the
permission it requires (`requiredPermission: 'events:publish'`), and
visibility is computed by checking that permission against the current
user's resolved permission set — the same set `requirePermission` checks
server-side. Role arrays are removed from `navigation-config.tsx`.

## Consequences

- One place (`ROLE_PERMISSIONS` in `role.types.ts`) defines what each role
  can do; the nav can no longer drift from it because it no longer has an
  independent opinion.
- This also closes part of the gap in `TODO.md`'s "authorize by role, not
  just by login" item: once route groups check `requirePermission` the same
  way the nav does, the two surfaces agree by construction rather than by
  convention.
- `CustomRole`-backed permissions (currently dead — `rbac.ts:81-91`) plug
  into the same resolution path once implemented, with no separate nav
  vocabulary to update.
