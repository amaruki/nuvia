# Architecture Overview

## Layering — what's actually true, not what the old README claimed

The original README described a four-layer
`Controller → Service → Manager → Data` architecture. There has never been
a `managers/` directory, and `src/lib/services/` is inconsistent — some
"services" hit the database, most don't (they return mock data; see
`docs/adr/0008-module-maturity-gate.md`). The honest layering, and the one
this document blesses going forward:

```
route.ts / server action  →  service function  →  Drizzle (src/db/client.ts)
```

- **`route.ts` / server action**: parses and validates input (zod), calls
  `requirePermission` ([ADR-0001](../adr/0001-one-authorization-helper.md))
  as its first real line, calls exactly one service function, returns an
  RFC 9457 shape on error ([ADR-0002](../adr/0002-rfc9457-error-contract.md)).
  No direct Drizzle calls in `src/app/**` — verified today (0 of 104 pages
  import Drizzle directly; the goal is to keep it that way as real routes
  get built).
- **Service function**: plain `async function`, not a class with static
  methods (the current `RoleService`/`OAuthService`/`LoggingService` classes
  predate this document; new services follow the function form). Takes
  already-validated input, calls Drizzle, throws domain errors.
- **Drizzle** (`src/db/client.ts`, `src/db/schema/`): the only place SQL
  gets generated. No raw `$queryRaw`-equivalent outside a documented
  exception.

## Route-group taxonomy

Three route groups, each encoding a security boundary in the directory
structure itself so the boundary is visible in a file listing, not just in
someone's head:

- **`(public)`** — no session required. No mutation actions may be
  imported into a page in this group (a lint/CI rule, `TODO.md` M2).
  Today this group incorrectly contains
  `events/[id]/edit/page.tsx` and `events/[id]/check-in/page.tsx` — both
  privileged operations that need to move to `(authenticated)` or
  `(admin)` (`TODO.md` M1).
- **`(authenticated)`** — session required, no specific role. A
  layout-level `requirePermission`/session check gates the whole group
  (this is the fix for the "authorization by role, not just login" gap
  in `TODO.md` M1 — today only `src/proxy.ts` checks that a session
  exists at all, at the network boundary, not per route group).
- **`(admin)`** — session + specific permission required, checked at the
  layout level with the exact permission the group's pages need.

`src/proxy.ts` (Next.js 16's `middleware.ts` replacement — see the
correction in `TODO.md`) stays as the coarse, fast, network-boundary
authentication check; the route-group layouts add the fine-grained
authorization check proxy.ts was never meant to do.

## Module system and the maturity gate

Every domain (members, events, finance, chapters, ...) is a "module" with a
maturity tier and a feature flag — see
[ADR-0008](../adr/0008-module-maturity-gate.md) for the promotion criteria.
The registry lives in `config/features.ts`. A module's own README (once it
exists) states its current tier; this document just defines what the tiers
mean.

**What "the seam" obliges a contributor to do**, concretely: a new domain
table gets an `orgId` column (default `"default"`, indexed) even though
there's only one organization today — see
[ADR-0007](../adr/0007-single-association-tenant-seam.md). It does _not_
oblige row-level security or a tenant-scoped query wrapper; those are
explicitly out of scope until real multi-tenancy is a real requirement.

## What's solid and worth building on

- `src/app/api/v1/admin/users/route.ts`'s pattern
  (`requirePermission` → response factory → data layer) is the template
  every new route should match, modulo the response factory becoming RFC
  9457 ([ADR-0002](../adr/0002-rfc9457-error-contract.md)).
- The permission taxonomy in `src/types/role.types.ts` — 14 roles, 12
  permission modules — is a genuinely good fit for an AMS's actual
  authorization needs (treasurer, chapter_president, committee_chair, etc.)
  and does not need redesigning, only wiring up fully
  (custom roles are defined but never resolved — `TODO.md` M1).
