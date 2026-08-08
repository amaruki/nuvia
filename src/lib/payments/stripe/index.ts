/**
 * Stripe payment gateway adapter (ADR-0015 §3, backlog C3).
 *
 * Selected when PAYMENT_GATEWAY=stripe; resolvePaymentGateway() is the only
 * place that constructs it. The adapter never logs money, never branches at
 * call sites — it maps provider shapes onto the PaymentGateway seam and
 * nothing else.
 *
 * Testing seam: the constructor accepts an injected `StripeClientSurface`
 * (the exact SDK slice this adapter touches), so unit tests run against a
 * fake key and mocked responses — no network, ever, in tests.
 *
 * Money crosses this boundary in minor units only (ADR-0015 §5).
 *
 * Split into concern modules: ./client (client/config), ./checkout
 * (checkout session helpers), ./webhook (signature/parse), ./types (state
 * vocabulary and maps). This file keeps the gateway class and re-exports
 * the module's public surface.
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
} from "../gateway";
import { resolveStripeClient, type StripeClientSurface, type StripeGatewayOptions } from "./client";
import { createCheckoutSession } from "./checkout";
import {
  isStripeState,
  SUBSCRIPTION_STATUS_BY_STATE,
  TRANSACTION_STATUS_BY_STATE,
  type StripeState,
} from "./types";
import { constructStripeEvent, mapStripeEvent } from "./webhook";

export class StripeGateway implements PaymentGateway {
  readonly provider = "stripe" as const;

  private readonly client: StripeClientSurface;
  private readonly webhookSecret: string;

  constructor(options: StripeGatewayOptions = {}) {
    const resolved = resolveStripeClient(options);
    this.client = resolved.client;
    this.webhookSecret = resolved.webhookSecret;
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    return createCheckoutSession(this.client, input);
  }

  async verifyWebhook(request: IncomingWebhook): Promise<VerifiedWebhookEvent> {
    return mapStripeEvent(constructStripeEvent(this.client, this.webhookSecret, request));
  }

  async getChargeStatus(providerTxId: string): Promise<ChargeStatus> {
    try {
      if (providerTxId.startsWith("ch_")) {
        const charge = await this.client.charges.retrieve(providerTxId);
        const state: StripeState = charge.refunded
          ? charge.amount_refunded >= charge.amount
            ? "refunded"
            : "partially_refunded"
          : charge.status === "succeeded"
            ? "succeeded"
            : charge.status === "failed"
              ? "failed"
              : "pending";

        return { providerTxId, providerState: state, amountMinor: charge.amount };
      }

      const intent = await this.client.paymentIntents.retrieve(providerTxId);
      return { providerTxId, providerState: intent.status, amountMinor: intent.amount };
    } catch (error) {
      if (error instanceof GatewayError) throw error;
      throw new GatewayError(
        `Stripe charge lookup failed for ${providerTxId}: ${error instanceof Error ? error.message : String(error)}`,
        "CHARGE_QUERY_FAILED",
      );
    }
  }

  toTransactionStatus(providerState: string): TransactionStatus {
    if (!isStripeState(providerState)) {
      throw new GatewayError(`Unknown Stripe state: ${providerState}`, "UNKNOWN_STATE");
    }
    return TRANSACTION_STATUS_BY_STATE[providerState];
  }

  toSubscriptionStatus(providerState: string): SubscriptionStatus | null {
    if (!isStripeState(providerState)) {
      throw new GatewayError(`Unknown Stripe state: ${providerState}`, "UNKNOWN_STATE");
    }
    return SUBSCRIPTION_STATUS_BY_STATE[providerState];
  }
}

export { STRIPE_STATES, isStripeState } from "./types";
export type { StripeState } from "./types";
export type { StripeClientSurface, StripeGatewayOptions } from "./client";
export { stripeEventMeta } from "./webhook";
