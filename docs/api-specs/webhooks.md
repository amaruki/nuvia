# API Spec — Webhooks

Provider callbacks. Route: `src/app/api/v1/webhooks/stripe/route.ts`
(ADR-0015 §4, backlog C3).

## POST /api/v1/webhooks/stripe

**Authorization exception.** `docs/api/conventions.md` requires
`requirePermission` in every route handler, but a provider callback carries
no user session. This route authenticates the caller by signature
verification against `STRIPE_WEBHOOK_SECRET` instead — the authentication
ADR-0015 §4 mandates for callbacks. Unverified payloads never reach the
payment service. This is the single documented exception to "authorize
before parsing".

Runtime: `nodejs` (the Stripe SDK uses Node crypto). Raw body: App Router
route handlers do not pre-parse request bodies, so `request.text()` yields
the exact bytes `webhooks.constructEvent` must verify.

### Request

Stripe POSTs the event JSON with a `Stripe-Signature` header. No user
session, no API key, no JSON schema — the body is verified first, then
mapped by `stripeEventMeta`.

### Responses

| Status | When                                                                                                                                                                    |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 200    | Processed, or deliberately ignored (duplicate delivery / unsupported event type). Body: `{ received: true, duplicate, action, eventId }` in the standard envelope       |
| 400    | `webhook-signature-missing`, `webhook-signature-invalid`, or `webhook-secret-missing` (`BAD_REQUEST_CODES`), or `invalid-webhook-event` when the event cannot be mapped |
| 404    | The configured gateway has no provider — manual mode (`PAYMENT_GATEWAY=manual`)                                                                                         |
| 500    | Processing failed. The idempotency claim was rolled back in the service, so Stripe's retries get another chance                                                         |

Errors are still RFC 9457 problem documents. Duplicate deliveries are
absorbed by the idempotency claim inside `processGatewayWebhook`
(`src/lib/services/payment.service.ts`) and answered 200 with
`duplicate: true` — that is why the contract never answers 409 here.
