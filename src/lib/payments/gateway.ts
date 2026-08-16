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
 * ISO 4217 minor-unit exponents. Most currencies use 2 decimals; a few are
 * zero-decimal (the minor unit IS the unit) and a handful use 3. Issue #27
 * (finding 2): `toMinorUnits`/`toAmountString` hardcoded ×100, which would
 * over-charge a zero-decimal tier 100× (¥10,000 -> ¥1,000,000).
 */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "ISK",
  "JPY",
  "KMF",
  "KRW",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);
const THREE_DECIMAL_CURRENCIES = new Set(["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"]);

/**
 * The platform's reporting currency. Every money column defaults to USD and
 * no UI mints other currencies today; aggregates use this as the headline
 * currency and EXCLUDE (never silently mix) rows in any other currency
 * (issue #27, finding 2).
 */
export const BASE_CURRENCY = "USD";

/** Number of minor-unit digits for an ISO 4217 currency (defaults to 2). */
export function currencyExponent(currency: string): number {
  const code = currency.toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(code)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(code)) return 3;
  return 2;
}

/**
 * Convert a numeric(10,2) string-mode amount to minor units at the adapter
 * boundary. Exact integer arithmetic — never float math on money. The
 * exponent is currency-aware (default USD = 2 decimals) so zero-decimal
 * currencies convert 1:1 instead of being inflated ×100.
 */
export function toMinorUnits(amount: string, currency: string = "USD"): number {
  const exponent = currencyExponent(currency);
  const match = /^(\d{1,8})(?:\.(\d+))?$/.exec(amount);
  if (!match) {
    throw new GatewayError(
      `"${amount}" is not a valid numeric(10,2) amount string`,
      "INVALID_AMOUNT",
    );
  }
  const fraction = match[2] ?? "";
  if (fraction.length > exponent) {
    throw new GatewayError(
      `"${amount}" has more than ${exponent} decimal place(s) for ${currency.toUpperCase()}`,
      "INVALID_AMOUNT",
    );
  }
  return Number(match[1]) * 10 ** exponent + Number(fraction.padEnd(exponent, "0") || "0");
}

/** Convert minor units back to a numeric(10,2) string-mode amount. */
export function toAmountString(minorUnits: number, currency: string = "USD"): string {
  if (!Number.isInteger(minorUnits) || minorUnits < 0) {
    throw new GatewayError(
      `Minor units must be a non-negative integer, got ${minorUnits}`,
      "INVALID_AMOUNT",
    );
  }
  const exponent = currencyExponent(currency);
  const divisor = 10 ** exponent;
  const whole = Math.floor(minorUnits / divisor);
  const fraction = String(minorUnits % divisor).padStart(exponent, "0");
  return exponent === 0 ? `${whole}` : `${whole}.${fraction}`;
}

import { ManualGateway } from "./manual";
import { StripeGateway } from "./stripe";

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
      resolved = new StripeGateway();
      break;
    }
    default: {
      const unhandled: never = env.PAYMENT_GATEWAY;
      throw new GatewayError(`Unknown payment gateway: ${String(unhandled)}`, "UNKNOWN_PROVIDER");
    }
  }

  return resolved;
}
