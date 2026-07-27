# ADR-0002: RFC 9457 Problem Details as the sole API error contract

**Status:** Accepted, not yet implemented (tracked in `TODO.md` M2)

## Context

Three in-house response shapes exist:

| Factory                                       | File                     | Routes using it                                    |
| --------------------------------------------- | ------------------------ | -------------------------------------------------- |
| `AuthResponseFactory`                         | `src/lib/auth/common.ts` | 6 of 23                                            |
| `createSuccessResponse`/`createErrorResponse` | `src/lib/errors.ts`      | 0                                                  |
| —                                             | —                        | 19 of 23 hand-roll `NextResponse.json(...)` inline |

Three response shapes for the same job form the drift pattern that this whole hardening effort exists to stop. The obvious fix — "pick one of the three" — still leaves an arbitrary, unstandardized error format that every client integration must learn from scratch.

## Decision

Adopt **[RFC 9457, Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)** (the 2023 revision that obsoletes RFC 7807) as the single error contract for every `/api/v1/**` route. Error responses:

- Content-Type: `application/problem+json`
- Body: `{ type, title, status, detail, instance, ...extensions }`
- Validation errors add a `errors` extension member (an array of `{ field, message }`). This member replaces the ad-hoc `zod-validation-error` shapes scattered across routes today.

Success responses keep a project-defined envelope. `docs/api/conventions.md` documents this envelope. RFC 9457 standardizes only the error case, the one actually contested here.

## Why this and not "pick one of the three in-house factories"

A standards-anchored answer is independently checkable. A contract test can assert `response.headers.get('content-type') === 'application/problem+json'` and a JSON Schema shape, rather than "matches whatever `AuthResponseFactory` happens to emit this week." It is also the only one of the four options that does not require every API consumer (including a future public API surface) to learn a bespoke shape.

## Consequences

- **This is a breaking API change.** It must land before any new domain routes are written. M3's members, events, and finance work depends on it. If it lands after that work, the team must retrofit every new route.
- `AuthResponseFactory`, `errors.ts`'s response helpers, and every inline `NextResponse.json` error shape are deleted or rewritten.
- A shared `problemResponse()` helper in `src/lib/http.ts` (new) becomes the only way to construct an error response. `oxlint` blocks `NextResponse.json` calls containing an `error`/`success: false` shaped literal outside that helper (custom rule, see `TODO.md` M2's CI checks).
