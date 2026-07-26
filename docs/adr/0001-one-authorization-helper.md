# ADR-0001: One authorization helper — `requirePermission`

**Status:** Accepted

## Context

Three implementations of API-route authorization exist in this codebase:

| Helper                                                          | File                         | Routes using it |
| --------------------------------------------------------------- | ---------------------------- | --------------- |
| `requirePermission`                                             | `src/lib/rbac.ts`            | 5 of 23         |
| `withAuth` / `withRole` / `withResourceAuth` / `authMiddleware` | `src/lib/auth/middleware.ts` | 0               |
| `authorizeApi`                                                  | `src/lib/security.ts`        | 0               |

`createAuthMiddleware` (also in `auth/middleware.ts`) is a fourth thing that
looks similar but does something different: it's the function `src/proxy.ts`
uses for coarse authentication (is there a session at all) at the network
boundary, not per-route permission checks. It stays; it isn't part of this
decision.

## Decision

`requirePermission` (and `requireRole`, its role-level sibling) in
`src/lib/rbac.ts` is the **only** authorization helper for API routes and
server actions. It's the one already in real use, it composes with the
`` `${module}:${action}` `` permission model in `src/types/role.types.ts`,
and its usage pattern — `requirePermission` → `AuthResponseFactory` →
Drizzle — is documented in `docs/architecture/overview.md` as the canonical
route shape.

`withAuth`, `withRole`, `withResourceAuth`, `authMiddleware`, and
`authorizeApi` are deleted. Nothing imports them (verified: zero references
outside their own definition files).

## Consequences

- Every `route.ts` handler that mutates or reads privileged data calls
  `requirePermission('module:action')` as its first line after parsing
  input. This is enforced going forward by the custom CI check described in
  `docs/adr/0009-security-hardening-p0.md` (every `route.ts` must call an
  authz helper).
- `oxlint`'s `no-restricted-imports` blocks importing the deleted helpers,
  with a message pointing here.
- Server actions get the same treatment — `requirePermission` works outside
  a `NextRequest` context too, since it reads the session via
  `auth.api.getSession()` under the hood.
