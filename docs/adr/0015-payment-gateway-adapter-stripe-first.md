# ADR-0015: Payment gateway adapter, Stripe first

**Status:** Accepted (owner decision, 2026-08-08)

## Context

No payment SDK exists in this codebase. Every finance/dues wiring item in
`docs/planning/01-todo-backlog.md` Wave C depends on this decision: dues
billing is the product core of an AMS, and finance is first in the promotion
order (`docs/technical-specs/13-module-maturity-gate.md` §13.4).

The competing answers were Stripe, Midtrans, and manual-first-only. The owner
decision is: **build the adapter first, so the same seam serves Stripe or any
other gateway; implement Stripe over Midtrans as the first concrete adapter.**
Midtrans remains a likely second adapter (Indonesia-focused: bank transfer,
e-wallets, QRIS) but is not built now.

## Decision

1. **A provider-agnostic gateway adapter is the only seam finance code may
   talk to.** `src/lib/payments/gateway.ts` defines the interface; finance
   services (subscription lifecycle, invoicing, payment recording) import the
   adapter, never a provider SDK. The adapter surface covers what dues
   billing needs: creating a checkout/authorization for a tier price,
   handling provider callbacks (webhooks), querying a charge's status, and
   mapping provider states onto the internal `membership_subscriptions` /
   `membership_transactions` states.

2. **Stripe is the first concrete adapter** (`src/lib/payments/stripe/index.ts`),
   added with an exactly pinned SDK version per the repo's dependency rule.
   Provider selection is deployment configuration (`PAYMENT_GATEWAY` env),
   not code branching at call sites.

3. **Manual-first stays a valid gateway.** An installation with no provider
   configured gets the manual adapter: the treasurer records payments
   (bank transfer, cash, check) through the finance UI, and the same
   subscription lifecycle consumes the recorded payment. This keeps the M3
   journey (signup → paid dues → event registration) reachable without any
   external account, and keeps self-hosting credential-free.

4. **Provider webhooks are verified before they are trusted** — Stripe
   signature verification at the webhook route; no payload is acted on
   unverified. Privileged financial mutations write the audit log in the same
   database transaction (`docs/PRINCIPLES.md`, fast-vs-auditable).

5. **Money crosses the adapter boundary in minor units; inside the system it
   stays `numeric(10,2)` string mode.** Cents conversion lives only in the
   Stripe adapter.

## Consequences

- Adding Midtrans (or any gateway) later is one new adapter file, one env
  value, and webhook-route wiring — no finance-service changes. This is the
  explicit reason the adapter precedes the first provider.
- Finance code is testable against the manual adapter without network access
  or API keys; Stripe-specific behavior is isolated in one file plus its
  webhook verification.
- The Stripe SDK is the first payment dependency in the codebase. It lands at
  an exact pinned version, in its own deliberate commit.
- A deployment that configures Stripe takes on Stripe's availability and
  compliance surface (PCI SAQ scope stays minimal because card data never
  touches this server — checkout is provider-hosted).
