/**
 * Payment service payload types (backlog C3) — the recorded-payment result
 * shape and the verified-webhook processing contract.
 */

import type { MembershipInvoice, MembershipPayment, MembershipTransaction } from "@/db/schema";

/** Recorded payment + its ledger transaction + the invoice afterwards. */
export interface RecordedPayment {
  payment: MembershipPayment;
  transaction: MembershipTransaction;
  invoice: MembershipInvoice;
}

export interface WebhookEventContext {
  /** Provider event id (e.g. Stripe evt_...) — the idempotency key. */
  eventId: string;
  /** Provider event type (e.g. checkout.session.completed) — audit metadata. */
  eventType: string;
}

export interface WebhookProcessingResult {
  duplicate: boolean;
  eventId: string;
  action: "renewed" | "activated" | "past-due" | "canceled" | "recorded" | "none";
  subscriptionId: string | null;
  transactionId?: string;
}
