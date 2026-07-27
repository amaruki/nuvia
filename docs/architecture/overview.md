# Architecture Overview

## Layering — What Is Actually True, Not What the Old README Claimed

The original README described a four-layer `Controller → Service → Manager → Data` architecture. A `managers/` directory never existed. The `src/lib/services/` directory is inconsistent. Some "services" query the database. Most do not query the database. Instead, they return mock data (see `docs/adr/0008-module-maturity-gate.md`). This document defines the correct layering for future work:

```
route.ts / server action  →  service function  →  Drizzle (src/db/client.ts)
```

- **`route.ts` / server action**: parses and validates input (zod), calls `requirePermission` ([ADR-0001](../adr/0001-one-authorization-helper.md)) as its first real line, calls exactly one service function, and returns an RFC 9457 shape on error ([ADR-0002](../adr/0002-rfc9457-error-contract.md)). No direct Drizzle calls exist in `src/app/**` — verified today. 0 of 104 pages import Drizzle directly. The goal is to keep it that way as contributors add real routes.
- **Service function**: a plain `async function`, not a class with static methods. The current `RoleService`, `OAuthService`, and `LoggingService` classes predate this document. New services use the function form. A service function takes already-validated input, calls Drizzle, and throws domain errors.
- **Drizzle** (`src/db/client.ts`, `src/db/schema/`): the only component that generates SQL. No raw `$queryRaw` equivalent exists outside a documented exception.

## Route-Group Taxonomy

Three route groups exist. Each route group encodes a security boundary in the directory structure. This structure makes the boundary visible in a file listing. The boundary does not depend on one person's memory:

- **`(public)`** — this group requires no session. A page in this group must not import mutation actions (a lint/CI rule, `TODO.md` M2). This group incorrectly contains `events/[id]/edit/page.tsx` and `events/[id]/check-in/page.tsx` today. Both pages perform privileged operations. Both pages must move to `(authenticated)` or `(admin)` (`TODO.md` M1).
- **`(authenticated)`** — this group requires a session, with no specific role required. A layout-level `requirePermission` check gates the whole group. This check fixes the "authorization by role, not just login" gap in `TODO.md` M1. Today, `src/proxy.ts` only checks that a session exists. `src/proxy.ts` performs this check at the network boundary, not at the route-group level.
- **`(admin)`** — this group requires a session and a specific permission. The layout checks this permission. The layout checks the exact permission that the group's pages need.

`src/proxy.ts` (Next.js 16's `middleware.ts` replacement — see the correction in `TODO.md`) remains the coarse, fast, network-boundary authentication check. The route-group layouts add the fine-grained authorization check. `src/proxy.ts` does not perform this fine-grained check.

## Module System and the Maturity Gate

Every domain (members, events, finance, chapters, and other domains) should become a "module" with a maturity tier and a feature flag — see [ADR-0008](../adr/0008-module-maturity-gate.md) for the promotion criteria. **This gate does not exist yet** (`TODO.md` M3, "Module promotion gate"). The file `config/features.ts` does not exist. This gap is narrower than "unrestricted," however. The six modules without a database (finance, awards, learning, chapters, committees, workspaces) remain role-gated like every other dashboard section. `src/proxy.ts` performs this gating through `isRoleAllowedForPath` (`src/lib/dashboard-access.ts`). This function checks the per-path `roles` list in `src/lib/navigation-data.ts`. A maturity flag independent of role is missing. A user whose role permits the section sees a fully mock UI with no real schema behind it. The required role for this section ranges from admin-only to any member, depending on the module. Nothing in the UI marks this section as mock data. "Flagged off for every role" is the target state that this ADR defines. This target state is not the current state. A module's own README, once it exists, states the module's current tier. This document defines only what each tier means.

**What "the seam" requires from a contributor**, concretely: a new domain table must include an `orgId` column (default `"default"`, indexed). This applies even though only one organization exists today (see [ADR-0007](../adr/0007-single-association-tenant-seam.md)). The seam does _not_ require row-level security or a tenant-scoped query wrapper. Row-level security and a query wrapper remain out of scope until real multi-tenancy becomes an actual requirement.

## What Is Solid and Worth Building On

- The pattern in `src/app/api/v1/admin/users/route.ts` (`requirePermission` → response factory → data layer) is the template for every new route. The response factory must still change to RFC 9457 ([ADR-0002](../adr/0002-rfc9457-error-contract.md)).
- The permission taxonomy in `src/types/role.types.ts` (14 roles, 12 permission modules) is a good fit for the actual authorization needs of an AMS (for example, treasurer, chapter_president, committee_chair). This taxonomy does not need a redesign. This taxonomy needs full integration only. The code defines custom roles today. The code never resolves custom roles today (`TODO.md` M1).
</content>
