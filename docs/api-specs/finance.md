# API Spec — Finance

Membership tiers, subscriptions, invoices, recorded payments, reports, and
the configured payment gateway (backlog C1–C5, ADR-0014/ADR-0015). Routes:
`src/app/api/v1/finance/**`; shared helpers in
`src/app/api/v1/finance/_lib/helpers.ts`; schemas in
`src/lib/validation/finance.validation.ts`; the subscription state machine in
`src/lib/services/subscription/`; other service layers in
`src/lib/services/{membership-tier,invoice,finance-report}.service.ts` and
`src/lib/services/payment/`.

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

## Budgets

Budget categories and their transactions live in `budget_categories` /
`budget_transactions` (schema in `src/db/schema/budgets.ts`, validation in
`src/lib/validation/budget.validation.ts`, service in
`src/lib/services/budget.service.ts`). Category spend is derived, never
stored: it is the exact sum of the category's **approved expense**
transactions (refunds and income never offset it).

| Method + Path                                    | Permission       | Request                                                                 | Success                      |
| ------------------------------------------------ | ---------------- | ----------------------------------------------------------------------- | ---------------------------- |
| GET `/api/v1/finance/budgets`                    | `finance:read`   | `page`, `limit` (≤100)                                                  | 200 `{ categories, meta }`   |
| POST `/api/v1/finance/budgets`                   | `finance:create` | `budgetCategoryCreateSchema`                                            | 201 `{ category }`           |
| GET `/api/v1/finance/budget-transactions`        | `finance:read`   | `type`, `status`, `categoryId`, `page`, `limit` (≤100)                  | 200 `{ transactions, meta }` |
| POST `/api/v1/finance/budget-transactions`       | `finance:create` | `budgetTransactionCreateSchema`                                         | 201 `{ transaction }`        |
| GET `/api/v1/finance/budget-transactions/{id}`   | `finance:read`   | —                                                                       | 200 `{ transaction }`; 404   |
| PATCH `/api/v1/finance/budget-transactions/{id}` | `finance:update` | `budgetTransactionUpdateSchema` (status and/or notes; empty body → 422) | 200 `{ transaction }`; 404   |

`budgetCategoryCreateSchema`: required `name` (1–100), `color` (1–50),
`allocatedAmount` (money string); optional `description` (≤500). Every
category row returns computed `spentAmount`, `remainingAmount`, and
`percentageUsed` (one decimal, unbounded above 100; when the allocation is
zero it reports 100 if spend exists and 0 otherwise — clients that need the
over-budget verdict compare `spentAmount` against `allocatedAmount`
directly, since no finite percentage expresses overspend on a zero
allocation).

`budgetTransactionCreateSchema`: required `categoryId`, `description`
(1–500), `amount` (strictly positive money string), `type` (`expense` \|
`income` \| `refund`); optional `status` (`pending` default \| `approved` \|
`rejected` — recording `approved` attributes the approval to the caller),
`date` (coerced, defaults to now), `vendor` (≤200), `receiptUrl` (URL ≤2048),
`notes` (≤2000). Empty strings on the optional text fields are treated as
omitted.

PATCH moves the status and/or notes. Approving stamps `approvedBy` (the
acting user) and `approvedAt`; moving back to `pending`/`rejected` clears
both. Money fields are immutable after recording. There is no DELETE: the
rejection status is the honest negative path.

## Donations

Donations live in `donations` (schema in `src/db/schema/donations.ts`,
validation in `src/lib/validation/donation.validation.ts`, service in
`src/lib/services/donation.service.ts`). Amounts are `numeric(10,2)` money
strings, same as invoices. There is no donation payments store yet.

| Method + Path                          | Permission       | Request                                                                      | Success                   |
| -------------------------------------- | ---------------- | ---------------------------------------------------------------------------- | ------------------------- |
| GET `/api/v1/finance/donations`        | `finance:read`   | `status`, `page`, `limit` (≤100)                                             | 200 `{ donations, meta }` |
| POST `/api/v1/finance/donations`       | `finance:create` | `donationCreateSchema`                                                       | 201 `{ donation }`        |
| GET `/api/v1/finance/donations/{id}`   | `finance:read`   | —                                                                            | 200 `{ donation }`; 404   |
| PATCH `/api/v1/finance/donations/{id}` | `finance:update` | `donationUpdateSchema` (status/notes/receiptSent/campaign; empty body → 422) | 200 `{ donation }`; 404   |

`donationCreateSchema`: required `donorName` (1–200), `donorEmail`, `amount`
(strictly positive money string); optional `donorType` (`individual` default
\| `organization` \| `anonymous`), `donationType` (`one_time` default \|
`recurring` \| `pledge`), `campaign` (≤200), `currency` (3-letter ISO code,
`USD` default), `status` (`pending` default \| `completed` \| `failed` \|
`refunded` \| `pledged`), `paymentMethod` (≤100), `transactionId` (≤200),
`donationDate` (ISO 8601 date or datetime, defaults to now), `receiptSent`
(`false` default), `notes` (≤2000).

PATCH moves only `status`, `notes`, `receiptSent`, and `campaign`
(`notes`/`campaign` accept `null` to clear). Donor identity, amount,
currency, and date are immutable after recording, and there is no DELETE:
corrections are new rows (a `refunded` donation), not rewritten history.

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
