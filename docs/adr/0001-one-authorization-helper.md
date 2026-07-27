# ADR-0001: One authorization helper — `requirePermission`

**Status:** Accepted

## Context

Three implementations of API-route authorization exist in this codebase:

| Helper                                                          | File                         | Routes using it |
| --------------------------------------------------------------- | ---------------------------- | --------------- |
| `requirePermission`                                             | `src/lib/rbac.ts`            | 5 of 23         |
| `withAuth` / `withRole` / `withResourceAuth` / `authMiddleware` | `src/lib/auth/middleware.ts` | 0               |
| `authorizeApi`                                                  | `src/lib/security.ts`        | 0               |

`createAuthMiddleware` (also in `auth/middleware.ts`) is a fourth function that looks similar but does something different. It is the function that `src/proxy.ts` uses for coarse authentication (is there a session at all) at the network boundary, not for per-route permission checks. It stays. It is not part of this decision.

## Decision

`requirePermission` (and `requireRole`, its role-level sibling) in `src/lib/rbac.ts` is the **only** authorization helper for API routes and server actions. It is the one already in real use. It works with the `` `${module}:${action}` `` permission model in `src/types/role.types.ts`. `docs/architecture/overview.md` documents its usage pattern — `requirePermission` → `AuthResponseFactory` → Drizzle — as the canonical route shape.

`withAuth`, `withRole`, `withResourceAuth`, `authMiddleware`, and `authorizeApi` are deleted. Nothing imports them (verified: zero references outside their own definition files).

## Consequences

- Every `route.ts` handler that mutates or reads privileged data calls `requirePermission('module:action')` as its first line after parsing input. The custom CI check described in `docs/adr/0009-security-hardening-p0.md` enforces this rule from now on (every `route.ts` must call an authorization helper).
- `oxlint`'s `no-restricted-imports` rule blocks any import of the deleted helpers. Its message points to this file.
- Server actions receive the same treatment. `requirePermission` also works outside a `NextRequest` context, because it reads the session with `auth.api.getSession()`.
