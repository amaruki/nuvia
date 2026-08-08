# API Spec — Finance

Membership tiers, subscriptions, invoices, recorded payments, reports, and
the configured payment gateway (backlog C1–C5, ADR-0014/ADR-0015). Routes:
`src/app/api/v1/finance/**`; shared helpers in
`src/app/api/v1/finance/_lib/helpers.ts`; schemas in
`src/lib/validation/finance.validation.ts`; service-layer state machines in
`src/lib/services/{membership-tier,subscription,invoice,payment,finance-report}.service.ts`.

## Cross-cutting conventions

- **Permissions** are granular: `finance:read`, `finance:create`,
  `finance:update`, `finance:delete` (not just read/manage).
- **Money is string mode**: amounts accept/return decimal strings matching
  `/^\d{1,8}(\.\d{1,2})?$/` (numeric(10,2) under the hood, ADR-0015 §5).
- **Actor context**: every write builds an `ActorContext` from the session
  (`actorFromRequest`), including the caller's IP for the audit trail and an
  optional `reason` string where a lifecycle schema is parsed.
- **Errors**: `problemFromFinanceError` maps `NotFoundError` → 404
  `not-found`, `BusinessLogicError` → 400 `business-logic-error` — or 409
  `conflict` when the error code is one of `INVALID_TRANSITION`,
  `SUBSCRIPTION_ALREADY_ACTIVE`, `SUBSCRIPTION_STILL_ENTITLED`,
  `TIER_NAME_TAKEN`, `TIER_IN_USE`, `TIER_INACTIVE`, `INVOICE_NOT_PAYABLE`,
  `INVOICE_NOT_VOIDABLE`, `OVERPAYMENT_NOT_ALLOWED` — and anything else to
  500 `internal-error`.
- **JSON bodies** on create endpoints (tiers, subscriptions, invoices,
  payments) are parsed with `request.json()` directly: a non-JSON body gets
  400 `invalid-json` (not 422). Lifecycle actions use the lenient
  `parseOptionalJsonBody` (an absent/empty body is fine; a malformed one is
  400).
- All POST creates return **201**.
- List responses wrap items plus pagination in `meta` per the conventions
  doc — except the report and invoice/payment lists below, which nest
  `meta` inside `data` (see [Known divergences](./_index.md#known-divergences)).

## Tiers

| Method + Path                       | Permission       | Request                                            | Success                                                 |
| ----------------------------------- | ---------------- | -------------------------------------------------- | ------------------------------------------------------- |
| GET `/api/v1/finance/tiers`         | `finance:read`   | `?includeInactive=true` optional                   | 200 `{ tiers, total }`                                  |
| POST `/api/v1/finance/tiers`        | `finance:create` | `createTierSchema`                                 | 201 `{ tier }`                                          |
| GET `/api/v1/finance/tiers/{id}`    | `finance:read`   | —                                                  | 200 `{ tier }`; 404                                     |
| PATCH `/api/v1/finance/tiers/{id}`  | `finance:update` | `updateTierSchema` (partial of `tierFieldsSchema`) | 200; deactivating a tier in use → 409 `TIER_IN_USE`     |
| DELETE `/api/v1/finance/tiers/{id}` | `finance:delete` | —                                                  | 200 `{ deleted: true }`; refuses while referenced (409) |

`tierFieldsSchema`: required `name` (1–100), `billingCycle` (`monthly`,
`yearly`, `lifetime`), `amount` (money string); optional `description`
(≤1000), `isActive` (default true), `isDefault` (default false), `trialDays`
(int 0–365, default 0), `gracePeriodDays` (int 0–90, default 0), `features`
(record of boolean/string/number, default {}), `metadata`. 409
`TIER_NAME_TAKEN` on duplicate names.

## Subscriptions

| Method + Path                            | Permission       | Request                                                                  | Success                                                                                       |
| ---------------------------------------- | ---------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| GET `/api/v1/finance/subscriptions`      | `finance:read`   | `userId`, `tierId`, `status`, `limit` (1–200, default 50), `offset` (≥0) | 200 `{ subscriptions, total }`                                                                |
| POST `/api/v1/finance/subscriptions`     | `finance:create` | `createSubscriptionSchema`                                               | 201; runs the A3 member-status sync, so the user's role is promoted in the same request       |
| GET `/api/v1/finance/subscriptions/{id}` | `finance:read`   | —                                                                        | 200 `{ subscription, memberStatus }` — the member status the A3 derivation computes right now |

`status` filter values: `ACTIVE`, `TRIALING`, `CANCELED`, `PAST_DUE`,
`UNPAID`, `PAUSED`.

`createSubscriptionSchema`: required `userId`, `tierId`; optional
`startDate` (coerced date), `trialDays` (int ≥0 — 0 skips the tier's trial),
`trialEnd` (coerced date \| null — implies a trial), `metadata`. The tier
must be active (409 `TIER_INACTIVE`).

### Lifecycle actions — `POST /api/v1/finance/subscriptions/{id}/{action}`

All require `finance:update`, all take an optional JSON body, all return 200
with the transition result. Invalid transitions → 409 `INVALID_TRANSITION`
or the specific codes above; unknown id → 404.

| Action     | Body                                 | Effect (ADR-0014)                                                                                                                     |
| ---------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `renew`    | `{ reason? }`                        | renews a `TRIALING`/`ACTIVE`/`PAST_DUE` subscription; creates the next-period row                                                     |
| `pause`    | `{ reason? }`                        | → `PAUSED`                                                                                                                            |
| `resume`   | `{ reason? }`                        | `PAUSED` → back to active                                                                                                             |
| `past-due` | `{ reason? }`                        | flags a failed renewal → `PAST_DUE`                                                                                                   |
| `expire`   | `{ reason? }`                        | ends a subscription that ran out its period                                                                                           |
| `cancel`   | `{ atPeriodEnd?: boolean, reason? }` | `false` (default): cancel now — the row moves to `CANCELED` and grace runs to period end; `true`: keeps running until the period ends |

`reason` is capped at 500 chars (`lifecycleActionSchema` /
`cancelSubscriptionSchema`).

## Invoices

| Method + Path                             | Permission       | Request                                                                                 | Success                                                                           |
| ----------------------------------------- | ---------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| GET `/api/v1/finance/invoices`            | `finance:read`   | `userId`, `subscriptionId`, `status` (`ISSUED`\|`PAID`\|`VOID`), `page`, `limit` (≤100) | 200 `{ invoices, meta }`                                                          |
| POST `/api/v1/finance/invoices`           | `finance:create` | `createInvoiceSchema`                                                                   | 201 `{ invoice }`                                                                 |
| GET `/api/v1/finance/invoices/{id}`       | `finance:read`   | —                                                                                       | 200 `{ invoice }`; 404                                                            |
| POST `/api/v1/finance/invoices/{id}/void` | `finance:update` | `{ reason? }` optional                                                                  | 200 `{ invoice }`; 404 unknown; 409 `INVOICE_NOT_VOIDABLE` when already PAID/VOID |

`createInvoiceSchema`: required `subscriptionId` — an invoice always bills
exactly one subscription (user + tier are derived from it); optional `items`
(≥1 of `{ description (1–500), quantity (int ≥1, default 1), unitPrice
(money) }` — omitted items produce a single default line item from the tier
price), `notes` (≤2000), `dueDate` (coerced date).

## Payments

| Method + Path                       | Permission       | Request                                                         | Success                                                                            |
| ----------------------------------- | ---------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| GET `/api/v1/finance/payments`      | `finance:read`   | `invoiceId`, `userId`, `subscriptionId`, `page`, `limit` (≤100) | 200 `{ payments, meta }`                                                           |
| POST `/api/v1/finance/payments`     | `finance:create` | `recordPaymentSchema`                                           | 201; 400 `OVERPAYMENT_NOT_ALLOWED`, 409 `INVOICE_NOT_PAYABLE` (invoice not ISSUED) |
| GET `/api/v1/finance/payments/{id}` | `finance:read`   | —                                                               | 200 `{ payment }`; 404                                                             |

`recordPaymentSchema`: required `invoiceId`, `amount` (money string);
optional `paymentMethod` (1–100; the UI offers `STRIPE`, `BANK_TRANSFER`,
`CASH`, `CHECK`, `OTHER` — the API accepts any string), `reason` (≤500).
Payments against non-ISSUED invoices and overpayments are rejected by the
service.

## Reports

All require `finance:read`. These serve the finance dashboard; everything is
derived live from `membership_transactions` + `membership_invoices` — nothing
is stored.

| Method + Path                          | Query                                                                                                   | Success                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET `/api/v1/finance/reports/invoices` | `status` ∈ `sent`\|`paid`\|`overdue`\|`cancelled`\|`all` (default `all`), `userId`, `page`, `limit`     | 200 `{ rows, meta }` — invoices joined to member + tier with dashboard statuses (`sent`/`paid`/`overdue`/`cancelled`) derived from real invoice columns |
| GET `/api/v1/finance/reports/dues`     | `status` ∈ `pending`\|`partial`\|`paid`\|`overdue`\|`cancelled`\|`all` (default `all`), `page`, `limit` | 200 `{ rows, meta }` — org-wide dues ledger; `ISSUED` invoices split into `pending`/`partial` on due date and partial payment                           |
| GET `/api/v1/finance/reports/summary`  | `months` (1–36, default 12) — revenue window                                                            | 200 `{ summary }` — computed aggregates                                                                                                                 |

## Gateways

| Method + Path                  | Permission     | Request | Success           |
| ------------------------------ | -------------- | ------- | ----------------- |
| GET `/api/v1/finance/gateways` | `finance:read` | —       | 200 `{ gateway }` |

Exactly one gateway exists and it is managed by deployment config
(`PAYMENT_GATEWAY` env, ADR-0015), not dashboard CRUD — there is no create/
update/delete here. The response exposes provider, status, and credential
_presence_ only — never values.

## Errors

400 `invalid-json` / `business-logic-error`; 401/403 auth; 404 `not-found`;
409 `conflict` (transition and uniqueness codes listed above); 422
`validation-error` with `errors[]`; 500 `internal-error`.
