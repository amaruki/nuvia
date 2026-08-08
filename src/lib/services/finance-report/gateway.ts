/**
 * Gateway status — the deployment's configured payment gateway, read from
 * the env seam. Only credential *presence* is exposed, never values.
 */

import { env } from "@/lib/env";
import type { ConfiguredGatewayStatus } from "./types";

/**
 * The deployment's configured payment gateway, from the same env seam C3's
 * adapters use (docs/adr/0015). Read-only: there is exactly one configured
 * gateway and it is managed by deployment config, not dashboard CRUD.
 * Only credential *presence* is exposed — never values.
 */
export function describeConfiguredGateway(): ConfiguredGatewayStatus {
  if (env.PAYMENT_GATEWAY === "stripe") {
    return {
      provider: "stripe",
      displayName: "Stripe",
      status: "active",
      description:
        "Card and payment-link processing through the Stripe adapter. " +
        "Checkout sessions are created server-side and confirmed by signed webhooks.",
      webhookEndpoint: "/api/v1/webhooks/stripe",
      secretKeyConfigured: Boolean(env.STRIPE_SECRET_KEY),
      webhookSecretConfigured: Boolean(env.STRIPE_WEBHOOK_SECRET),
    };
  }

  return {
    provider: "manual",
    displayName: "Manual (treasurer)",
    status: "active",
    description:
      "No external processor is configured. Payments are recorded manually against " +
      "issued invoices; invoice status follows the recorded payments.",
    webhookEndpoint: null,
    secretKeyConfigured: null,
    webhookSecretConfigured: null,
  };
}
