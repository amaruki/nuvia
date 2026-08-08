/**
 * Stripe client construction and adapter configuration (ADR-0015 §3).
 *
 * Resolves credentials from options or env and picks the SDK surface:
 * production gets the real client, tests inject a mock. The gateway never
 * logs money and never constructs the SDK anywhere else.
 */

import Stripe from "stripe";
import { env } from "@/lib/env";
import { GatewayError } from "../gateway";

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

/** Resolved credentials and SDK surface the gateway runs against. */
export interface ResolvedStripeClient {
  client: StripeClientSurface;
  webhookSecret: string;
}

/**
 * Resolve the API key, webhook secret, and SDK surface from options with env
 * fallbacks. Throws GatewayError("MISSING_CREDENTIALS") when no API key is
 * configured.
 */
export function resolveStripeClient(options: StripeGatewayOptions = {}): ResolvedStripeClient {
  const apiKey = options.apiKey ?? env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new GatewayError(
      "STRIPE_SECRET_KEY is required when PAYMENT_GATEWAY=stripe",
      "MISSING_CREDENTIALS",
    );
  }

  return {
    client: options.client ?? (new Stripe(apiKey) as unknown as StripeClientSurface),
    webhookSecret: options.webhookSecret ?? env.STRIPE_WEBHOOK_SECRET ?? "",
  };
}
