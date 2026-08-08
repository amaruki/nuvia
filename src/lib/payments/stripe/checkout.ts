/**
 * Stripe Checkout session helper (ADR-0015 §3).
 *
 * Validates the tier-price input, creates the provider checkout session, and
 * maps the response back onto the PaymentGateway seam. Money crosses this
 * boundary in minor units only (ADR-0015 §5).
 */

import { GatewayError, type CheckoutInput, type CheckoutResult } from "../gateway";
import type { StripeClientSurface } from "./client";

/** Validate the checkout input and create a Stripe Checkout session for it. */
export async function createCheckoutSession(
  client: StripeClientSurface,
  input: CheckoutInput,
): Promise<CheckoutResult> {
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw new GatewayError(
      `Checkout amount must be a positive integer of minor units, got ${input.amountMinor}`,
      "INVALID_AMOUNT",
    );
  }

  try {
    const session = await client.checkout.sessions.create({
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
