/**
 * Stripe webhook signature verification and event parsing (ADR-0015 §3).
 *
 * Nothing unverified ever becomes a VerifiedWebhookEvent: the signature
 * check runs first, then the verified event is mapped onto the seam. The
 * webhook route (app/api/v1/webhooks/stripe) consumes the result plus
 * stripeEventMeta() for the idempotency key and the audit trail.
 */

import type Stripe from "stripe";
import { GatewayError, type IncomingWebhook, type VerifiedWebhookEvent } from "../gateway";
import type { StripeClientSurface } from "./client";

/**
 * Verify the stripe-signature header against the configured secret and
 * return the parsed provider event. Every failure path is a distinct
 * GatewayError code so the webhook route can answer precisely.
 */
export function constructStripeEvent(
  client: StripeClientSurface,
  webhookSecret: string,
  request: IncomingWebhook,
): Stripe.Event {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    throw new GatewayError("Missing stripe-signature header", "WEBHOOK_SIGNATURE_MISSING");
  }
  if (!webhookSecret) {
    throw new GatewayError(
      "STRIPE_WEBHOOK_SECRET is not configured; cannot verify webhook",
      "WEBHOOK_SECRET_MISSING",
    );
  }

  try {
    return client.webhooks.constructEvent(request.body, signature, webhookSecret);
  } catch {
    throw new GatewayError(
      "Stripe webhook signature verification failed",
      "WEBHOOK_SIGNATURE_INVALID",
    );
  }
}

/** Map a verified Stripe event onto the gateway seam's webhook shape. */
export function mapStripeEvent(stripeEvent: Stripe.Event): VerifiedWebhookEvent {
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
        providerState: charge.amount_refunded >= charge.amount ? "refunded" : "partially_refunded",
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
