# API Conventions

Applies to every route under `src/app/api/v1/**`. See
[ADR-0001](../adr/0001-one-authorization-helper.md) and
[ADR-0002](../adr/0002-rfc9457-error-contract.md).

## Route shape

```ts
export async function POST(request: NextRequest) {
  const auth = await requirePermission("module:action");
  if (!auth.success) return problemResponse(auth.error);

  const body = await request.json();
  const parsed = someSchema.safeParse(body);
  if (!parsed.success) return problemResponse(validationProblem(parsed.error));

  const result = await someService(parsed.data, auth.user.id);
  return successResponse(result); // success envelope, see below
}
```

Order matters: authorize before you parse untrusted input where the check
is cheap (an unauthenticated request shouldn't cause the server to do work
parsing a large body), parse before you touch the database.

## Errors — RFC 9457

Every error response is `application/problem+json`:

```json
{
  "type": "https://nuvia.dev/problems/insufficient-permission",
  "title": "Insufficient permission",
  "status": 403,
  "detail": "Requires events:publish",
  "instance": "/api/v1/events/abc123/publish",
  "traceId": "..."
}
```

Validation failures add an `errors` extension member:
`errors: [{ field: "email", message: "Invalid email address" }]`. The
`problemResponse()` helper (`src/lib/http.ts`) is the only sanctioned way
to build one of these — not `NextResponse.json` with an error-shaped
literal inline. Every route under `/api/v1/**` uses it as of the RFC 9457
migration; `AuthResponseFactory` and the ad-hoc inline shapes it replaced
are gone from that surface (server actions like
`oauth-better-auth.actions.ts` are a separate lane — RFC 9457 is an HTTP
response-shape standard, and actions don't return HTTP responses).

## Success envelope

Not standardized by RFC 9457 (which only covers errors). Until a v2 API
surface is deliberately versioned differently:

```json
{ "data": { ... }, "meta": { "timestamp": "...", "version": "v1" } }
```

## Versioning

`/api/v1/` is the only version today. A breaking change to an existing
route's request/response shape means a new `/api/v2/` route, not a silent
change to `v1` — this API has no consumers yet, but the convention starts
now rather than after the first breaking change actually happens.

## Pagination

`page` (1-indexed) and `limit` (max 100, default 20) query params;
response includes `{ page, limit, total, totalPages }` in `meta`. Already
the de facto pattern in `admin/users/route.ts` — this just names it as the
standard rather than something to reinvent per route.

## The mandatory authorization call

Every `route.ts` handler calls `requirePermission` or `requireRole`
(ADR-0001) before doing anything privileged. The sweep that enforces this
exists today as a unit test — `tests/unit/auth-route-coverage.test.ts` —
which greps every `route.ts` under `/api/v1/**` for an authorization or
session-check call and fails the suite on any handler that lacks one.

Three routes are recorded in that test's `KNOWN_EXCEPTIONS`, each with its
own non-session authentication mechanism documented there:

- `webhooks/stripe` — Stripe-Signature HMAC verification (ADR-0015 §4).
- `demo/login` — disposable demo-account login, rate-limited, forwarding
  credentials to better-auth's sign-in handler.
- `health` — anonymous deployment probe; returns dependency reachability
  booleans only (see `docs/DEPLOYMENT_PLAN.md` §Health checks).

Each exception entry asserts the route has no auth call, so the moment one
gains a real check the test fails loudly and the entry must come out.
