/**
 * Stripe provider state vocabulary and status maps (ADR-0015 §3).
 *
 * The raw states Stripe emits across checkout sessions, invoices, charges,
 * payment intents, and refunds, plus the adapter's mapping from them onto
 * the internal statuses of the PaymentGateway seam.
 */

import type { SubscriptionStatus, TransactionStatus } from "../gateway";

/** Raw Stripe states this adapter can emit or consume. */
export const STRIPE_STATES = [
  // checkout sessions
  "open",
  "complete",
  "expired",
  // provider invoices
  "paid",
  // charges / payment intents
  "succeeded",
  "failed",
  "canceled",
  "pending",
  "processing",
  "requires_action",
  "requires_payment_method",
  "requires_confirmation",
  "requires_capture",
  // refunds
  "refunded",
  "partially_refunded",
] as const;
export type StripeState = (typeof STRIPE_STATES)[number];

export function isStripeState(state: string): state is StripeState {
  return (STRIPE_STATES as readonly string[]).includes(state);
}

export const TRANSACTION_STATUS_BY_STATE: Record<StripeState, TransactionStatus> = {
  open: "PENDING",
  pending: "PENDING",
  processing: "PENDING",
  requires_action: "PENDING",
  requires_payment_method: "PENDING",
  requires_confirmation: "PENDING",
  requires_capture: "PENDING",
  complete: "COMPLETED",
  paid: "COMPLETED",
  succeeded: "COMPLETED",
  failed: "FAILED",
  canceled: "CANCELED",
  expired: "CANCELED",
  refunded: "REFUNDED",
  partially_refunded: "PARTIALLY_REFUNDED",
};

export const SUBSCRIPTION_STATUS_BY_STATE: Record<StripeState, SubscriptionStatus | null> = {
  complete: "ACTIVE",
  paid: "ACTIVE",
  succeeded: "ACTIVE",
  failed: "PAST_DUE",
  canceled: "CANCELED",
  // No subscription transition: expiry, pending-ish states, and refunds are
  // ledger facts the lifecycle consumes separately (a refund alone does not
  // cancel — same rule as the manual adapter).
  open: null,
  expired: null,
  pending: null,
  processing: null,
  requires_action: null,
  requires_payment_method: null,
  requires_confirmation: null,
  requires_capture: null,
  refunded: null,
  partially_refunded: null,
};
