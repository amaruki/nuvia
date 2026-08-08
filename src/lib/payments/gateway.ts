/**
 * Payment gateway adapter seam — the single interface finance code talks to
 * about payments. See docs/adr/0015-payment-gateway-adapter-stripe-first.md.
 *
 * Rules this file enforces:
 * - Finance services import this adapter, never a provider SDK.
 * - Money crosses the adapter boundary in minor units (cents); inside the
 *   system it stays numeric(10,2) string mode. `toMinorUnits` /
 *   `toAmountString` are the conversion helpers — adapters use them, finance
 *   services never convert.
 * - Provider callbacks are verified before they are trusted: `verifyWebhook`
 *   must reject any payload it cannot verify.
 * - The provider is deployment configuration (`PAYMENT_GATEWAY` env),
 *   resolved in exactly one place (`resolvePaymentGateway`) — call sites
 *   never branch on provider names.
 *
 * C3 adds the Stripe adapter against this same interface without touching
 * the finance services.
 */

import { env } from "@/lib/env";
import type { MembershipSubscription, MembershipTransaction } from "@/db/schema";

/** Internal subscription state providers map onto (membership_subscriptions.status). */
export type SubscriptionStatus = MembershipSubscription["status"];

/** Internal transaction state providers map onto (membership_transactions.status). */
export type TransactionStatus = MembershipTransaction["status"];

/** Provider names accepted by the PAYMENT_GATEWAY env variable. */
export const PAYMENT_PROVIDERS = ["manual", "stripe"] as const;
export type PaymentProviderName = (typeof PAYMENT_PROVIDERS)[number];

export class GatewayError extends Error {
  public code: string;

  constructor(message: string, code: string = "GATEWAY_ERROR") {
    super(message);
    this.name = "GatewayError";
    this.code = code;
  }
}

/** Everything an adapter needs to create a checkout/authorization for a tier price. */
export interface CheckoutInput {
  userId: string;
  subscriptionId: string;
  tierId: string;
  tierName: string;
  /** Amount in minor currency units (cents for USD). */
  amountMinor: number;
  /** ISO 4217 code, e.g. "USD". */
  currency: string;
  description?: string;
  /** Where the provider should send the member back after a hosted checkout. */
  returnUrl?: string;
  /** Passthrough the provider echoes on callbacks (must include subscriptionId). */
  metadata?: Record<string, string>;
}

export interface CheckoutResult {
  /** Provider-hosted checkout URL; null when the provider has no hosted step. */
  checkoutUrl: string | null;
  /** The provider's reference for this charge; null until the provider assigns one. */
  providerTxId: string | null;
  /** Raw provider state of the just-created charge — map via the gateway. */
  providerState: string;
}

export interface IncomingWebhook {
  headers: Headers;
  /** The raw request body — signature verification must run against these exact bytes. */
  body: string;
}

/** A callback that passed verification. Nothing unverified ever becomes one of these. */
export interface VerifiedWebhookEvent {
  providerTxId: string;
  /** Raw provider state — map via toTransactionStatus / toSubscriptionStatus. */
  providerState: string;
  /** Echoed passthrough when the provider returns it; null otherwise. */
  subscriptionId: string | null;
  /** The verified provider payload, for audit metadata. */
  raw: unknown;
}

export interface ChargeStatus {
  providerTxId: string;
  /** Raw provider state — map via the gateway. */
  providerState: string;
  amountMinor: number | null;
}

export interface PaymentGateway {
  /** Stable provider identifier, stored on membership_transactions.payment_provider. */
  readonly provider: PaymentProviderName;

  /**
   * Create a checkout/authorization for a tier price. Providers with a hosted
   * checkout return its URL; providers without a hosted step (manual) settle
   * the charge immediately.
   */
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;

  /**
   * Parse and verify a provider callback. Must throw GatewayError for any
   * payload it cannot verify — unverified payloads are never acted on
   * (ADR-0015 §4).
   */
  verifyWebhook(request: IncomingWebhook): Promise<VerifiedWebhookEvent>;

  /**
   * Query a charge's current state at the provider. Providers with no
   * external state (manual) throw GatewayError with code QUERY_NOT_SUPPORTED;
   * their charge state lives on membership_transactions instead.
   */
  getChargeStatus(providerTxId: string): Promise<ChargeStatus>;

  /** Map a raw provider state onto the internal transaction status. Throws on unknown states. */
  toTransactionStatus(providerState: string): TransactionStatus;

  /**
   * Map a raw provider state onto the internal subscription status. Returns
   * null when the state carries no subscription transition (e.g. a refund
   * alone does not cancel). Throws on unknown states.
   */
  toSubscriptionStatus(providerState: string): SubscriptionStatus | null;
}

/**
 * Convert a numeric(10,2) string-mode amount to minor units at the adapter
 * boundary. Exact integer arithmetic — never float math on money.
 */
export function toMinorUnits(amount: string): number {
  const match = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(amount);
  if (!match) {
    throw new GatewayError(
      `"${amount}" is not a valid numeric(10,2) amount string`,
      "INVALID_AMOUNT",
    );
  }
  const fraction = (match[2] ?? "").padEnd(2, "0");
  return Number(match[1]) * 100 + Number(fraction);
}

/** Convert minor units back to a numeric(10,2) string-mode amount. */
export function toAmountString(minorUnits: number): string {
  if (!Number.isInteger(minorUnits) || minorUnits < 0) {
    throw new GatewayError(
      `Minor units must be a non-negative integer, got ${minorUnits}`,
      "INVALID_AMOUNT",
    );
  }
  return `${Math.floor(minorUnits / 100)}.${String(minorUnits % 100).padStart(2, "0")}`;
}

import { ManualGateway } from "./manual";

let resolved: PaymentGateway | null = null;

/**
 * The one place the PAYMENT_GATEWAY env variable becomes an adapter instance.
 * Call sites use this; they never construct an adapter or branch on the name.
 */
export function resolvePaymentGateway(): PaymentGateway {
  if (resolved) return resolved;

  switch (env.PAYMENT_GATEWAY) {
    case "manual": {
      resolved = new ManualGateway();
      break;
    }
    case "stripe": {
      // The env value is declared ahead of the adapter (C3) so deployments can
      // be configured early; resolving it fails loudly until the adapter lands.
      throw new GatewayError(
        "PAYMENT_GATEWAY=stripe is configured but the Stripe adapter is not implemented yet",
        "PROVIDER_NOT_IMPLEMENTED",
      );
    }
    default: {
      const unhandled: never = env.PAYMENT_GATEWAY;
      throw new GatewayError(`Unknown payment gateway: ${String(unhandled)}`, "UNKNOWN_PROVIDER");
    }
  }

  return resolved;
}
