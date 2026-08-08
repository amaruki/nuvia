/**
 * POST /api/v1/webhooks/stripe — signature-verified Stripe callbacks
 * (ADR-0015 §4, backlog C3).
 *
 * Authorization exception: docs/api/conventions.md requires requirePermission
 * in every route handler, but a provider callback carries no user session.
 * This route authenticates the caller by signature verification against
 * STRIPE_WEBHOOK_SECRET instead — the authentication ADR-0015 §4 mandates
 * for callbacks. Unverified payloads never reach the payment service.
 *
 * Raw body: App Router route handlers do not pre-parse request bodies, so
 * `request.text()` yields the exact bytes `webhooks.constructEvent` must
 * verify (no bodyParser toggle needed — that was a Pages-API-only concern).
 * Runs on the Node runtime because the Stripe SDK uses Node crypto.
 *
 * Response contract:
 *  - 200 — processed, or deliberately ignored (duplicate / unsupported type)
 *  - 400 — signature missing/invalid or no signing secret configured
 *  - 404 — the configured gateway has no provider (manual mode)
 *  - 500 — processing failed; the idempotency claim was rolled back, so
 *          Stripe's retries get another chance
 */

import type { NextRequest } from "next/server";
import { problem, problemResponse, problems, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";
import { GatewayError, resolvePaymentGateway } from "@/lib/payments/gateway";
import { stripeEventMeta } from "@/lib/payments/stripe";
import { processGatewayWebhook } from "@/lib/services/payment.service";

export const runtime = "nodejs";

/** Verification failures answer 400; everything else falls through below. */
const BAD_REQUEST_CODES: Record<string, true> = {
  WEBHOOK_SIGNATURE_MISSING: true,
  WEBHOOK_SIGNATURE_INVALID: true,
  WEBHOOK_SECRET_MISSING: true,
};

export async function POST(request: NextRequest) {
  const body = await request.text();

  let gateway;
  try {
    gateway = resolvePaymentGateway();
  } catch (error) {
    logger.error("Webhook gateway resolution failed", error);
    return problemResponse(problems.internalError("Payment gateway misconfigured"));
  }

  let event;
  try {
    event = await gateway.verifyWebhook({ headers: request.headers, body });
  } catch (error) {
    if (error instanceof GatewayError) {
      if (error.code === "WEBHOOKS_NOT_SUPPORTED") {
        return problemResponse(
          problem(
            "webhooks-not-supported",
            404,
            "Webhooks not accepted",
            "The configured payment gateway has no external provider",
          ),
        );
      }
      if (error.code === "WEBHOOK_EVENT_UNSUPPORTED") {
        // Deliberately unhandled event types get a 200 so the provider does
        // not retry them forever.
        return successResponse({ received: true, ignored: true });
      }
      if (BAD_REQUEST_CODES[error.code] === true) {
        return problemResponse(
          problem("webhook-verification-failed", 400, "Webhook verification failed", error.message),
        );
      }
    }
    logger.error("Webhook verification error", error);
    return problemResponse(problems.internalError("An unexpected error occurred"));
  }

  const meta = stripeEventMeta(event.raw);
  if (!meta) {
    return problemResponse(problem("invalid-webhook-event", 400, "Invalid webhook event"));
  }

  try {
    const result = await processGatewayWebhook(
      event,
      { eventId: meta.id, eventType: meta.type },
      { actorId: "system:stripe-webhook" },
      gateway,
    );

    return successResponse({
      received: true,
      duplicate: result.duplicate,
      action: result.action,
      eventId: meta.id,
    });
  } catch (error) {
    // The idempotency claim was rolled back in the service; answering 500
    // makes the provider retry.
    logger.error(`Stripe webhook processing failed (${meta.id})`, error);
    return problemResponse(problems.internalError("An unexpected error occurred"));
  }
}
