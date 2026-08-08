# Finance module

**Maturity tier:** Promoted (`config/features.ts`, `finance: true` — flipped 2026-08-08, backlog C5)
**Gate authority:** [ADR-0008](../adr/0008-module-maturity-gate.md), [`docs/technical-specs/13-module-maturity-gate.md`](../technical-specs/13-module-maturity-gate.md)
**Promotion order:** first, per §13.4 — finance/dues is the product core for an AMS.

This document is the module's public-surface documentation required for the Promoted tier (`docs/PRINCIPLES.md`, "Easy to customize": a module documents its schema, API, and feature flag well enough that a developer can extend it without reading internal code first).

## What it does

Finance manages the association's dues billing: membership tiers, member subscriptions through their full lifecycle, invoices, payments (manual and gateway-verified), the transaction ledger, and treasurer-facing reports. It is the first module promoted out of the flag-off set; `TODO.md` M3's exit criterion ("signup → paid dues → event registration without touching mock data") depends on it.

## Feature flag and gating

- Registry: `MODULE_FLAGS.finance === true` in `config/features.ts` (§13.3 shape). Promotion switched the module on by default; the flag-off "Preview — mock data" marking (`src/components/dashboard/module-preview-banner.tsx`) returns null on its own once the flag is on — no banner removal code was needed.
- Path mapping: `/dashboard/finance/**` and `/dashboard/organization/budget` resolve to the `finance` module via `MODULE_PATH_PREFIXES` in `config/features.ts`.
- Role gate (separate mechanism, `src/proxy.ts` + `src/lib/navigation-data.ts:194-238`): the Finance section is visible to `admin`, `superadmin`, `treasurer`, `staff`; the Reports and Gateways pages additionally exclude `staff`.
- API authorization is per-action and permission-based (below) — reaching a page through the role gate does not grant any API permission by itself.

## Schema

Drizzle schema: `src/db/schema/membership.ts`; status enums in `src/db/schema/enums.ts`. All amounts are `numeric(10,2)` in string mode.

| Table                       | Drizzle constant (`membership.ts`) | Landed in                                                              |
| --------------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| `membership_tiers`          | `membershipTier` (:22)             | `drizzle/0000_cute_norman_osborn.sql` (Prisma→Drizzle, commit c688925) |
| `membership_subscriptions`  | `membershipSubscription` (:50)     | `drizzle/0000_cute_norman_osborn.sql`                                  |
| `membership_transactions`   | `membershipTransaction` (:75)      | `drizzle/0000_cute_norman_osborn.sql`                                  |
| `membership_invoices`       | `membershipInvoice` (:114)         | `drizzle/0004_plain_ultimo.sql` (commit 9a53fbe)                       |
| `membership_invoice_items`  | `membershipInvoiceItem` (:145)     | `drizzle/0004_plain_ultimo.sql` (commit 9a53fbe)                       |
| `membership_payments`       | `membershipPayment` (:159)         | `drizzle/0004_plain_ultimo.sql` (commit 9a53fbe)                       |
| `membership_webhook_events` | `membershipWebhookEvent` (:195)    | `drizzle/0004_plain_ultimo.sql` (commit 9a53fbe)                       |

Enums: `MembershipStatus` (`enums.ts:13`), `TransactionStatus` (`enums.ts:22`), `InvoiceStatus` (`enums.ts:34`). `membership_webhook_events` deduplicates provider deliveries with a unique constraint on `(provider, event_id)` (`membership.ts:207`).

## API surface

All routes live under `src/app/api/v1/finance/**` and follow `docs/api/conventions.md`: `requirePermission` first (ADR-0001), zod validation, RFC 9457 problem errors (ADR-0002), success envelope.

| Endpoint                                      | Method(s) | Permission       |
| --------------------------------------------- | --------- | ---------------- |
| `/api/v1/finance/tiers`                       | GET       | `finance:read`   |
| `/api/v1/finance/tiers`                       | POST      | `finance:create` |
| `/api/v1/finance/tiers/[id]`                  | GET       | `finance:read`   |
| `/api/v1/finance/tiers/[id]`                  | PATCH     | `finance:update` |
| `/api/v1/finance/tiers/[id]`                  | DELETE    | `finance:delete` |
| `/api/v1/finance/subscriptions`               | GET       | `finance:read`   |
| `/api/v1/finance/subscriptions`               | POST      | `finance:create` |
| `/api/v1/finance/subscriptions/[id]`          | GET       | `finance:read`   |
| `/api/v1/finance/subscriptions/[id]/renew`    | POST      | `finance:update` |
| `/api/v1/finance/subscriptions/[id]/cancel`   | POST      | `finance:update` |
| `/api/v1/finance/subscriptions/[id]/pause`    | POST      | `finance:update` |
| `/api/v1/finance/subscriptions/[id]/resume`   | POST      | `finance:update` |
| `/api/v1/finance/subscriptions/[id]/past-due` | POST      | `finance:update` |
| `/api/v1/finance/subscriptions/[id]/expire`   | POST      | `finance:update` |
| `/api/v1/finance/invoices`                    | GET       | `finance:read`   |
| `/api/v1/finance/invoices`                    | POST      | `finance:create` |
| `/api/v1/finance/invoices/[id]`               | GET       | `finance:read`   |
| `/api/v1/finance/invoices/[id]/void`          | POST      | `finance:update` |
| `/api/v1/finance/payments`                    | GET       | `finance:read`   |
| `/api/v1/finance/payments`                    | POST      | `finance:create` |
| `/api/v1/finance/payments/[id]`               | GET       | `finance:read`   |
| `/api/v1/finance/reports/summary`             | GET       | `finance:read`   |
| `/api/v1/finance/reports/dues`                | GET       | `finance:read`   |
| `/api/v1/finance/reports/invoices`            | GET       | `finance:read`   |
| `/api/v1/finance/gateways`                    | GET       | `finance:read`   |

Permission holders among predefined roles (`src/types/role.types.ts`): `superadmin` (all permissions), `admin` (`finance:create/read/update/delete/manage/approve/export`, :215-221), `treasurer` (`finance:create/read/update/manage/approve/export`, :296-310 — no `finance:delete`). No other predefined role carries a `finance:*` permission; custom roles may.

## Services and the gateway seam

- `src/lib/services/membership-tier.service.ts` — tier CRUD.
- `src/lib/services/subscription.service.ts` — lifecycle engine: create → trialing → active → past_due → renew/pause/resume/cancel → expire, with grace handling and the UNPAID path.
- `src/lib/services/invoice.service.ts` — invoice issuance from subscription events; void.
- `src/lib/services/payment.service.ts` — manual and webhook-verified payment recording into `membership_payments` + `membership_transactions`.
- `src/lib/services/finance-report.service.ts` — revenue by period/tier, outstanding summary, dues ledger, report summary (computed from transactions).
- `src/lib/services/membership-status.service.ts` — member status/role derived from subscription transitions ([ADR-0014](../adr/0014-member-status-from-subscription.md), backlog A3, commit cd534a3).
- `src/lib/payments/gateway.ts` + `manual.ts` + `stripe.ts` — the payment-gateway adapter seam ([ADR-0015](../adr/0015-payment-gateway-adapter-stripe-first.md)): manual provider built in (commit a43568b), Stripe adapter with signature-verified webhooks (commit e672c11, SDK pinned in commit 60d42d2).

**Audit trail:** privileged financial mutations (subscription transitions, invoice void, payment recording) write their `auth_logs` entry in the same database transaction as the mutation (`docs/technical-specs/07-security.md`, ADR-0009).

## Dashboard UI

Six pages under `src/app/dashboard/finance/`, wired to the services above through `src/lib/hooks/use-finance-{dues,invoices,reports,gateways}.ts` and `src/components/finance/**` (backlog C4, commit a17439c — the `mock-dues-data`-family hooks were deleted, not left behind flags):

| Page      | Path                           |
| --------- | ------------------------------ |
| Dues      | `/dashboard/finance/dues`      |
| Invoices  | `/dashboard/finance/invoices`  |
| Reports   | `/dashboard/finance/reports`   |
| Budget    | `/dashboard/finance/budget`    |
| Donations | `/dashboard/finance/donations` |
| Gateways  | `/dashboard/finance/gateways`  |

`src/app/dashboard/finance/layout.tsx` renders the shared mock-tier banner, which returns null now that the flag is on.

## Tests

79 tests across three files, run against the shared test database (real tables, real enums):

| File                                  | Tests | Covers                                                                                                                                                      |
| ------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/subscription-lifecycle/`       | 26    | gateway seam math, tier CRUD, full lifecycle machine, illegal transitions, A3 role derivation, same-transaction audit trail                                 |
| `tests/invoice-payment.test.ts`       | 39    | invoice issuance, manual payment recording, RFC 9457 error mapping, Stripe adapter (mocked SDK), verified-webhook processing end to end, validation schemas |
| `tests/finance-dashboard-api.test.ts` | 14    | report queries, dues ledger, invoice listing, gateway description, ledger consistency after void                                                            |

Run: `bun test tests/subscription-lifecycle/ tests/invoice-payment.test.ts tests/finance-dashboard-api.test.ts` (needs the test Postgres/Redis stack, `compose.test.yml`).

## Accessibility

WCAG 2.2 AA is part of the promotion bar for an enabled module. All six finance pages are in the axe smoke page list (`scripts/a11y-smoke.ts`) and passed on the 2026-08-08 promotion run with 0 critical/serious and 0 moderate/minor (raw results: `/tmp/nuvia-a11y-smoke-2026-08-08T12-31-42-567Z-4178875/`); the repo-wide `jsx-a11y` oxlint gate covers their code statically. One known-benign `prefer-tag-over-role` **warning** remains at `src/app/dashboard/finance/reports/page.tsx:183` (clickable report rows) — warning-level, keyboard-operable, deferred. Record: [`docs/accessibility/wcag-2.2-aa-enabled-modules.md`](../accessibility/wcag-2.2-aa-enabled-modules.md).

## Promotion bar evidence

| Criterion (ADR-0008 tier 4)            | Evidence                                                                                                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real Drizzle schema                    | `src/db/schema/membership.ts` + `enums.ts`; migrations `drizzle/0000_cute_norman_osborn.sql`, `drizzle/0004_plain_ultimo.sql` (commits c688925, 9a53fbe)        |
| Authorized API                         | 25 handlers under `src/app/api/v1/finance/**`, each calling `requirePermission("finance:*")` (commits d8e4251, df6de14, e672c11, a17439c)                       |
| Tests                                  | `tests/subscription-lifecycle/`, `tests/invoice-payment.test.ts`, `tests/finance-dashboard-api.test.ts` — 79 tests (commits d8e4251, df6de14, e672c11, a17439c) |
| Documentation                          | This document                                                                                                                                                   |
| WCAG 2.2 AA pass (enabled-module gate) | `bun run test:a11y` over all six finance pages, 0 critical/serious (2026-08-08); see the accessibility record above                                             |
| Flag on                                | `config/features.ts` `MODULE_FLAGS.finance = true` (this promotion)                                                                                             |

## Related decisions

- [ADR-0008](../adr/0008-module-maturity-gate.md) — the maturity gate itself.
- [ADR-0014](../adr/0014-member-status-from-subscription.md) — member status derived from the subscription lifecycle.
- [ADR-0015](../adr/0015-payment-gateway-adapter-stripe-first.md) — gateway adapter seam, Stripe first.
- `docs/technical-specs/13-module-maturity-gate.md` — binding tier definitions (§13.3 registry shape, §13.4 promotion order).
