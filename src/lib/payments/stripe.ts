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
 */

import Stripe from "stripe";
import { env } from "@/lib/env";
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

const TRANSACTION_STATUS_BY_STATE: Record<StripeState, TransactionStatus> = {
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

const SUBSCRIPTION_STATUS_BY_STATE: Record<StripeState, SubscriptionStatus | null> = {
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

/**
 * The SDK slice this adapter touches. Tests inject a mock; production gets
 * the real client. Kept structural so a mock needs only these four members.
 */
export interface StripeClientSurface {
  checkout: {
    sessions: {
      create(params: Stripe.Checkout.SessionCreateParams): Promise<Stripe.Checkout.Session>;
    };
  };
  webhooks: {
    constructEvent(payload: string, header: string, secret: string): Stripe.Event;
  };
  paymentIntents: {
    retrieve(id: string): Promise<Stripe.PaymentIntent>;
  };
  charges: {
    retrieve(id: string): Promise<Stripe.Charge>;
  };
}

export interface StripeGatewayOptions {
  /** Defaults to env.STRIPE_SECRET_KEY. */
  apiKey?: string;
  /** Defaults to env.STRIPE_WEBHOOK_SECRET. */
  webhookSecret?: string;
  /** Test seam — a mocked SDK surface. */
  client?: StripeClientSurface;
}

export class StripeGateway implements PaymentGateway {
  readonly provider = "stripe" as const;

  private readonly client: StripeClientSurface;
  private readonly webhookSecret: string;

  constructor(options: StripeGatewayOptions = {}) {
    const apiKey = options.apiKey ?? env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new GatewayError(
        "STRIPE_SECRET_KEY is required when PAYMENT_GATEWAY=stripe",
        "MISSING_CREDENTIALS",
      );
    }

    this.webhookSecret = options.webhookSecret ?? env.STRIPE_WEBHOOK_SECRET ?? "";
    this.client = options.client ?? (new Stripe(apiKey) as unknown as StripeClientSurface);
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new GatewayError(
        `Checkout amount must be a positive integer of minor units, got ${input.amountMinor}`,
        "INVALID_AMOUNT",
      );
    }

    try {
      const session = await this.client.checkout.sessions.create({
        mode: "payment",
        client_reference_id: input.userId,
        metadata: {
          subscriptionId: input.subscriptionId,
          tierId: input.tierId,
          ...input.metadata,
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: input.currency,
              unit_amount: input.amountMinor,
              product_data: {
                name: input.tierName,
                ...(input.description ? { description: input.description } : {}),
              },
            },
          },
        ],
        ...(input.returnUrl ? { success_url: input.returnUrl, cancel_url: input.returnUrl } : {}),
      });

      return {
        checkoutUrl: session.url,
        providerTxId:
          typeof session.payment_intent === "string" ? session.payment_intent : session.id,
        providerState:
          session.status === "complete"
            ? "complete"
            : session.status === "expired"
              ? "expired"
              : "open",
      };
    } catch (error) {
      throw new GatewayError(
        `Stripe checkout creation failed: ${error instanceof Error ? error.message : String(error)}`,
        "PROVIDER_ERROR",
      );
    }
  }

  async verifyWebhook(request: IncomingWebhook): Promise<VerifiedWebhookEvent> {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      throw new GatewayError("Missing stripe-signature header", "WEBHOOK_SIGNATURE_MISSING");
    }
    if (!this.webhookSecret) {
      throw new GatewayError(
        "STRIPE_WEBHOOK_SECRET is not configured; cannot verify webhook",
        "WEBHOOK_SECRET_MISSING",
      );
    }

    let stripeEvent: Stripe.Event;
    try {
      stripeEvent = this.client.webhooks.constructEvent(
        request.body,
        signature,
        this.webhookSecret,
      );
    } catch {
      throw new GatewayError(
        "Stripe webhook signature verification failed",
        "WEBHOOK_SIGNATURE_INVALID",
      );
    }

    return this.mapEvent(stripeEvent);
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

  /* ---------------------------------------------------------------- *
   * Event mapping
   * ---------------------------------------------------------------- */

  private mapEvent(stripeEvent: Stripe.Event): VerifiedWebhookEvent {
    const raw = stripeEvent.data.object;

    switch (stripeEvent.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = raw as Stripe.Checkout.Session;
        return {
          providerTxId:
            typeof session.payment_intent === "string" ? session.payment_intent : session.id,
          providerState: session.payment_status === "paid" ? "complete" : "open",
          subscriptionId: session.metadata?.subscriptionId ?? null,
          raw,
        };
      }
      case "checkout.session.async_payment_failed": {
        const session = raw as Stripe.Checkout.Session;
        return {
          providerTxId:
            typeof session.payment_intent === "string" ? session.payment_intent : session.id,
          providerState: "failed",
          subscriptionId: session.metadata?.subscriptionId ?? null,
          raw,
        };
      }
      case "checkout.session.expired": {
        const session = raw as Stripe.Checkout.Session;
        return {
          providerTxId:
            typeof session.payment_intent === "string" ? session.payment_intent : session.id,
          providerState: "expired",
          subscriptionId: session.metadata?.subscriptionId ?? null,
          raw,
        };
      }
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = raw as Stripe.Invoice;
        return {
          providerTxId: invoice.id,
          providerState: "paid",
          subscriptionId: invoice.metadata?.subscriptionId ?? null,
          raw,
        };
      }
      case "invoice.payment_failed": {
        const invoice = raw as Stripe.Invoice;
        return {
          providerTxId: invoice.id,
          providerState: "failed",
          subscriptionId: invoice.metadata?.subscriptionId ?? null,
          raw,
        };
      }
      case "charge.succeeded": {
        const charge = raw as Stripe.Charge;
        return {
          providerTxId: charge.id,
          providerState: "succeeded",
          subscriptionId: charge.metadata?.subscriptionId ?? null,
          raw,
        };
      }
      case "charge.failed": {
        const charge = raw as Stripe.Charge;
        return {
          providerTxId: charge.id,
          providerState: "failed",
          subscriptionId: charge.metadata?.subscriptionId ?? null,
          raw,
        };
      }
      case "charge.refunded": {
        const charge = raw as Stripe.Charge;
        return {
          providerTxId: charge.id,
          providerState:
            charge.amount_refunded >= charge.amount ? "refunded" : "partially_refunded",
          subscriptionId: charge.metadata?.subscriptionId ?? null,
          raw,
        };
      }
      case "payment_intent.succeeded": {
        const intent = raw as Stripe.PaymentIntent;
        return {
          providerTxId: intent.id,
          providerState: "succeeded",
          subscriptionId: intent.metadata?.subscriptionId ?? null,
          raw,
        };
      }
      case "payment_intent.payment_failed": {
        const intent = raw as Stripe.PaymentIntent;
        return {
          providerTxId: intent.id,
          providerState: "failed",
          subscriptionId: intent.metadata?.subscriptionId ?? null,
          raw,
        };
      }
      case "payment_intent.canceled": {
        const intent = raw as Stripe.PaymentIntent;
        return {
          providerTxId: intent.id,
          providerState: "canceled",
          subscriptionId: intent.metadata?.subscriptionId ?? null,
          raw,
        };
      }
      default: {
        // Not an error for the caller — the webhook route answers 200
        // "ignored" so Stripe does not retry an event we deliberately skip.
        throw new GatewayError(
          `Unhandled Stripe event type: ${stripeEvent.type}`,
          "WEBHOOK_EVENT_UNSUPPORTED",
        );
      }
    }
  }
}

/**
 * Extract the provider event id/type from a verified raw payload — used by
 * the webhook route for the idempotency key and the audit trail. Returns
 * null for payloads that are not Stripe events.
 */
export function stripeEventMeta(raw: unknown): { id: string; type: string } | null {
  if (typeof raw !== "object" || raw === null || !("id" in raw) || !("type" in raw)) return null;
  if (typeof raw.id !== "string" || typeof raw.type !== "string") return null;
  return { id: raw.id, type: raw.type };
}
