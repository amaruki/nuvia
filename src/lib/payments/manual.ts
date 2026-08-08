/**
 * Manual payment gateway — the default adapter (ADR-0015 §3).
 *
 * Installations with no provider configured get this one: the treasurer
 * records payments (bank transfer, cash, check) through the finance UI and
 * the subscription lifecycle consumes the recorded payment. There is no
 * external system, so checkout settles immediately, there are no callbacks
 * to verify, and there is no external charge to query — recorded state lives
 * on membership_transactions (C3 writes those rows through this seam).
 */

import {
  GatewayError,
  type ChargeStatus,
  type CheckoutInput,
  type CheckoutResult,
  type IncomingWebhook,
  type PaymentGateway,
  type SubscriptionStatus,
  type TransactionStatus,
  type VerifiedWebhookEvent,
} from "./gateway";

/** Raw states a manually recorded payment can carry. */
export const MANUAL_STATES = ["pending", "completed", "failed", "canceled", "refunded"] as const;
export type ManualState = (typeof MANUAL_STATES)[number];

export function isManualState(state: string): state is ManualState {
  return (MANUAL_STATES as readonly string[]).includes(state);
}

const TRANSACTION_STATUS_BY_STATE: Record<ManualState, TransactionStatus> = {
  pending: "PENDING",
  completed: "COMPLETED",
  failed: "FAILED",
  canceled: "CANCELED",
  refunded: "REFUNDED",
};

const SUBSCRIPTION_STATUS_BY_STATE: Record<ManualState, SubscriptionStatus | null> = {
  pending: null,
  completed: "ACTIVE",
  failed: "PAST_DUE",
  canceled: "CANCELED",
  // A refund alone does not cancel the subscription — lifecycle decides that.
  refunded: null,
};

export class ManualGateway implements PaymentGateway {
  readonly provider = "manual" as const;

  /**
   * A manual "checkout" is a payment the treasurer already received — there
   * is no hosted step to send the member to, so the charge settles as
   * completed immediately.
   */
  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new GatewayError(
        `Checkout amount must be a positive integer of minor units, got ${input.amountMinor}`,
        "INVALID_AMOUNT",
      );
    }

    return {
      checkoutUrl: null,
      providerTxId: `manual_${crypto.randomUUID()}`,
      providerState: "completed",
    };
  }

  /** The manual gateway has no external provider, so no callback can ever be legitimate. */
  async verifyWebhook(_request: IncomingWebhook): Promise<VerifiedWebhookEvent> {
    throw new GatewayError(
      "The manual gateway has no external provider; it accepts no callbacks",
      "WEBHOOKS_NOT_SUPPORTED",
    );
  }

  /** Manual charge state is the membership_transactions row, not an external system. */
  async getChargeStatus(_providerTxId: string): Promise<ChargeStatus> {
    throw new GatewayError(
      "Manual payments have no external charge to query; their status lives on membership_transactions",
      "QUERY_NOT_SUPPORTED",
    );
  }

  toTransactionStatus(providerState: string): TransactionStatus {
    if (!isManualState(providerState)) {
      throw new GatewayError(
        `Unknown manual provider state: "${providerState}"`,
        "UNKNOWN_PROVIDER_STATE",
      );
    }
    return TRANSACTION_STATUS_BY_STATE[providerState];
  }

  toSubscriptionStatus(providerState: string): SubscriptionStatus | null {
    if (!isManualState(providerState)) {
      throw new GatewayError(
        `Unknown manual provider state: "${providerState}"`,
        "UNKNOWN_PROVIDER_STATE",
      );
    }
    return SUBSCRIPTION_STATUS_BY_STATE[providerState];
  }
}
