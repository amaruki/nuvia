# ADR-0005: Permissions, not role arrays, as the authorization vocabulary

**Status:** Accepted, not yet implemented (tracked in `TODO.md` M1)

## Context

Two authorization vocabularies coexist:

- The server: `` `${module}:${action}` `` permissions (`src/types/role.types.ts`, for example `'events:publish'`), resolved per role via `ROLE_PERMISSIONS` and checked with `requirePermission` (ADR-0001).
- The UI nav: `roles?: UserRole[]` arrays (`src/lib/navigation-data.ts`, for example line 53: `roles: ["admin", "superadmin", "staff"]`).

Neither derives from the other. A role gains a permission in `ROLE_PERMISSIONS`, and the nav does not reflect it. The reverse can also happen. This gap remains unless someone updates both, by hand, in two different files with two different shapes.

## Decision

The permission model (`` `${module}:${action}` ``) is the single source of truth. Each nav entry declares the permission it requires (`requiredPermission: 'events:publish'`). The system computes nav visibility by checking that permission against the current user's resolved permission set. `requirePermission` checks against this same set server-side. Role arrays are removed from `navigation-config.tsx`.

## Consequences

- One place (`ROLE_PERMISSIONS` in `role.types.ts`) defines what each role can do. The nav can no longer drift from it, because it no longer has an independent opinion.
- This also closes part of the gap in `TODO.md`'s "authorize by role, not just by login" item. Once route groups check `requirePermission` the same way the nav does, the two surfaces agree by construction rather than by convention.
- `CustomRole`-backed permissions (`rbac.ts:85-98`, wired up in `2d7792f` — no longer dead) already resolve through this same permission vocabulary. Once nav visibility also derives from it, custom roles automatically get correct nav behavior, with no separate nav vocabulary to update.
