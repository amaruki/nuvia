# API Specifications

Per-domain endpoint contracts for every route under `src/app/api/`. These
specs are descriptive: [`docs/api/conventions.md`](../api/conventions.md)
remains the normative contract, and the route files themselves are the source
of truth this document set was generated from.

- Provenance: produced for backlog item F4 by a full scan of the
  `route.ts` files under `src/app/api/` on 2026-08-08 — first the 78 routes
  of the B/C waves, then extended in the finalization pass to all 92 routes
  once the D-wave modules (chapters, committees, learning, awards,
  workspaces) landed. Every method, permission, schema, and status code
  below was read out of the route file (or the service/schema module it
  imports) cited in each table row.
- When code and spec disagree, the code wins; update the spec.
- To regenerate the inventory: walk `src/app/api/**/route.ts`, record each
  exported HTTP verb, its `requirePermission(...)` / `requireRole(...)` call,
  the zod schema it `safeParse`s, and the status codes it returns.

## Domain files

| File                                 | Domain                                                    | Route prefix                                       | Endpoints |
| ------------------------------------ | --------------------------------------------------------- | -------------------------------------------------- | --------- |
| [`auth.md`](auth.md)                 | Session, credentials, profile, devices                    | `/api/auth/**`, `/api/v1/auth/**`, `/api/debug/**` | 22        |
| [`members.md`](members.md)           | Member directory (B1)                                     | `/api/v1/members`                                  | 2         |
| [`events.md`](events.md)             | Event CRUD + registrations (B2/B3)                        | `/api/v1/events`                                   | 9         |
| [`content.md`](content.md)           | Articles, publications, announcements, categories (B4)    | `/api/v1/content`                                  | 20        |
| [`media.md`](media.md)               | Uploads on local disk + manifest (B4 sub-decision)        | `/api/v1/media`                                    | 4         |
| [`forums.md`](forums.md)             | Posts, comments, categories, moderation, reports (B5)     | `/api/v1/forums`                                   | 18        |
| [`jobs.md`](jobs.md)                 | Postings + applications (B6)                              | `/api/v1/jobs`                                     | 12        |
| [`finance.md`](finance.md)           | Tiers, subscriptions, invoices, payments, reports (C2/C3) | `/api/v1/finance`                                  | 25        |
| [`awards.md`](awards.md)             | Award programs + nominations (D4)                         | `/api/v1/awards`                                   | 10        |
| [`learning.md`](learning.md)         | Courses + certificates (D3)                               | `/api/v1/learning`                                 | 9         |
| [`chapters.md`](chapters.md)         | Regional chapters + member rosters (D1)                   | `/api/v1/chapters`                                 | 5         |
| [`committees.md`](committees.md)     | Committees + member rosters (D2)                          | `/api/v1/committees`                               | 5         |
| [`workspaces.md`](workspaces.md)     | Member workspaces (D5)                                    | `/api/v1/workspaces`                               | 5         |
| [`admin.md`](admin.md)               | Roles, permissions, user management                       | `/api/v1/admin`                                    | 9         |
| [`organization.md`](organization.md) | Organization profile                                      | `/api/v1/organization`                             | 2         |
| [`webhooks.md`](webhooks.md)         | Stripe webhook receiver (C3)                              | `/api/v1/webhooks`                                 | 1         |

## Global conventions

Restated from [`docs/api/conventions.md`](../api/conventions.md); read that
document for the full rules.

1. **Authorize before parsing.** Every route handler calls
   `requirePermission()` or `requireRole()` (`src/lib/rbac/`) before
   reading the body. The single documented exception is
   [`webhooks.md`](webhooks.md), where the caller is authenticated by Stripe
   signature verification instead of a session (ADR-0015 §4).
2. **Successes use the project envelope** built by `successResponse(data,
meta?, init?)` in `src/lib/http.ts`:

   ```json
   {
     "data": {},
     "meta": { "timestamp": "2026-08-08T00:00:00.000Z", "version": "v1" }
   }
   ```

   List endpoints put pagination (`page`, `limit`, `total`, and where
   applicable `totalPages`) in `meta`; a few endpoints add `message`.

3. **Errors are RFC 9457** `application/problem+json`, built only through
   `problemResponse()` / `problem()` / `problems.*` in `src/lib/http.ts`.
   Validation failures add an `errors[]` extension via `validationProblem()`.

   ```json
   {
     "type": "https://<APP_URL>/problems/validation-error",
     "title": "Validation failed",
     "status": 422,
     "errors": [{ "field": "title", "message": "Title is required" }]
   }
   ```

## Error catalog

The shared catalog (`problems` in `src/lib/http.ts`). Domain pages list only
the additional slugs they can emit.

| Slug                      | Status | Title                   | Emitted when                                                               |
| ------------------------- | ------ | ----------------------- | -------------------------------------------------------------------------- |
| `authentication-required` | 401    | Authentication required | No valid session                                                           |
| `insufficient-permission` | 403    | Insufficient permission | Session valid, permission/role missing                                     |
| `not-found`               | 404    | Not found               | Unknown resource id                                                        |
| `conflict`                | 409    | Conflict                | State collision (duplicate slug, resolved report, invalid transition, ...) |
| `business-logic-error`    | 400    | Business logic error    | Domain rule violation without a specific slug                              |
| `validation-error`        | 422    | Validation failed       | zod rejection; carries `errors[]`                                          |
| `rate-limited`            | 429    | Too many requests       | Bucket exhausted; carries `retryAfter`                                     |
| `internal-error`          | 500    | Internal server error   | Anything unexpected                                                        |

## Rate limits

Applied by `rateLimitOrProblem()` (`src/lib/rate-limit.ts`) before anything
else in the rate-limited auth routes; Redis-backed when `REDIS_URL` is set
(see `docs/adr/0003-single-rate-limiter.md`).

| Bucket           | Limit | Window | Endpoints                                                                |
| ---------------- | ----- | ------ | ------------------------------------------------------------------------ |
| `login`          | 5     | 15 min | `POST /api/v1/auth/login`                                                |
| `changePassword` | 5     | 15 min | `POST /api/v1/auth/change-password`                                      |
| `forgotPassword` | 3     | 1 h    | `POST /api/v1/auth/forgot-password`                                      |
| `resetPassword`  | 3     | 1 h    | `POST /api/v1/auth/reset-password`                                       |
| `signup`         | 5     | 1 h    | `POST /api/v1/auth/signup`                                               |
| `verifyEmail`    | 10    | 15 min | `POST /api/v1/auth/verify-email`                                         |
| `api`            | 100   | 15 min | Backstop for everything else under `/api/**`, applied by the proxy layer |

## Known divergences

Recorded so consumers are not surprised; fixing them is code work outside
this doc set's scope (F4 is docs-only).

- **Every `/api/v1/forums/**` success path double-wraps the envelope.** The
  forum routes call `NextResponse.json(successResponse(...))`; since
  `successResponse()` already returns a `NextResponse`, the outer
  `NextResponse.json` serializes the Response object and the body arrives as
  `{}` with the intended status code (verified 2026-08-08). Error paths are
  unaffected (`problemResponse` is returned directly), and the forum service
  layer itself is fully tested (`tests/forums-api.test.ts`). The tables in
  [`forums.md`](forums.md) describe the intended contract.
- **Finance list endpoints nest pagination inside `data`.** The reports list,
  invoice list, and payment list return `data: { rows|invoices|payments,
meta: { page, limit, total, totalPages } }` instead of putting pagination
  in the top-level envelope `meta` like other domains.
