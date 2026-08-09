# 12. Permission Resolution Flow

Cite this document rather than restating the algorithm elsewhere. It is the single source of truth for how a `User`'s `Role` or `CustomRole` resolves to the `Permission` set that `requirePermission` checks.

## 12.1 The concern

Every authorization check in Nuvia (`requirePermission`, `requireRole`, and the dashboard's `isRoleAllowedForPath`) ultimately depends on resolving one user to a set of things they may do. This applies everywhere a permission or role check occurs: API routes, dashboard page access, and (once ADR-0005 is implemented project-wide) nav visibility.

## 12.2 Decision matrix

| Concern                        | Decision                                                                                               | Rationale                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Predefined role storage        | `users.role` is a plain `text` column, matched against the fixed `PREDEFINED_ROLES` union at read time | Avoids a Postgres enum migration every time a role is added                         |
| Predefined role -> permissions | Static lookup in `ROLE_PERMISSIONS: Record<PredefinedRole, Permission[]>`                              | No database round-trip for the common case                                          |
| Custom role detection          | `isPredefinedRole(role)` returns false for any string not in `PREDEFINED_ROLES`                        | The same `role` column holds both predefined and custom role names                  |
| Custom role -> permissions     | Database lookup: `custom_roles` row by `name`, using `permissions` (jsonb) if `isActive`, else empty   | Custom roles are data, not code; they must not require a deploy to add              |
| Superadmin                     | Resolves to `AVAILABLE_PERMISSIONS` (every permission), not a lookup                                   | Superadmin must never be locked out by a stale `ROLE_PERMISSIONS` entry             |
| Inactive/missing custom role   | Resolves to zero permissions, not an error                                                             | A soft-deleted or deactivated role degrades safely rather than crashing the request |

## 12.3 Interface / request shape

```ts
// src/lib/rbac/index.ts
async function getCurrentUser(): Promise<UserWithRole | null>;
// UserWithRole.permissions: Permission[] — the fully resolved set, per 12.4

function requirePermission(user: UserWithRole | null, permission: Permission): void; // throws AuthError on failure
function requireRole(user: UserWithRole | null, role: Role): void; // throws AuthError on failure
```

## 12.4 The algorithm

```
resolve(user.role):
    if role === "superadmin":
        return AVAILABLE_PERMISSIONS
    if isPredefinedRole(role):
        return ROLE_PERMISSIONS[role]
    // role is a CustomRole name
    row = db.query.customRole.findFirst(where name = role, columns: permissions, isActive)
    if row exists and row.isActive:
        return row.permissions as Permission[]
    return []  // inactive or absent custom role: zero permissions, not an error
```

`requirePermission(user, permission)` checks `permission in resolve(user.role)`; throws `problems.insufficientPermission()` (RFC 9457, Section 7) if not.

## 12.5 Performance targets

No specific latency budget is set for this resolution path today. The predefined-role branch is O(1) (a plain object lookup); the custom-role branch costs one indexed database read (`custom_roles.name` is unique). Source: `src/lib/rbac/` code inspection, not a measured benchmark (see Section 8).

## 12.6 What this does NOT do

- It does not cache the custom-role database lookup. Every request that resolves a custom-role user re-reads `custom_roles`. Adding a cache is an open follow-up if this becomes measurably slow, not a current requirement.
- It does not derive dashboard nav visibility from this same resolved permission set today. `src/lib/navigation-data/index.ts`'s per-item `roles` list is a separate, hand-maintained vocabulary (Section 2.4); ADR-0005 accepts unifying the two but it is not yet implemented project-wide.
- It does not support a user holding more than one role or custom role simultaneously. `users.role` is a single column.

## 12.7 Cross-references

| Concern                                              | Source                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| Authorization helper contract                        | [ADR-0001](../adr/0001-one-authorization-helper.md)          |
| Permissions-vs-roles nav unification (not yet built) | [ADR-0005](../adr/0005-permissions-not-roles.md)             |
| Dashboard role gate (separate mechanism)             | Section 2.4, `src/lib/dashboard-access.ts`                   |
| RFC 9457 error shape on denial                       | Section 7, [ADR-0002](../adr/0002-rfc9457-error-contract.md) |

## 12.8 Open follow-ups

- Unify predefined-role permissions and custom-role permissions with the dashboard's nav-visibility role list into one resolution path, per ADR-0005, once that migration is scheduled.
- Add a cache in front of the custom-role database lookup if profiling ever shows it as a hot path.
