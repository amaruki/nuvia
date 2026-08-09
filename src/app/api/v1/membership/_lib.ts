/**
 * Shared helpers for the /api/v1/membership funnel routes (UI-33):
 * request schemas and the error→RFC 9457 mapping for join/renew.
 */

import { z } from "zod";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import { actorFromRequest } from "@/app/api/v1/finance/_lib/helpers";
import { problem, problems, type ProblemDetails } from "@/lib/http";
import { logger } from "@/lib/logger";
import { GatewayError } from "@/lib/payments/gateway";

export { actorFromRequest };

export const joinSchema = z.object({
  tierId: z.string().uuid("Invalid tier ID"),
  returnUrl: z.string().trim().max(2048).optional(),
});

export const renewSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  returnUrl: z.string().trim().max(2048).optional(),
});

/**
 * Funnel errors: unknown/inactive tiers 404, business rules 400, and a
 * provider failure is reported honestly as 502 (never as a success).
 * RENEWAL_NOT_AVAILABLE is a business refusal, not a provider outage.
 */
export function problemFromFunnelError(error: unknown, context: string): ProblemDetails {
  if (error instanceof NotFoundError) {
    return problems.notFound(error.message);
  }
  if (error instanceof BusinessLogicError) {
    return problems.businessLogicError(error.message);
  }
  if (error instanceof GatewayError) {
    if (error.code === "RENEWAL_NOT_AVAILABLE") {
      return problems.businessLogicError(error.message);
    }
    return problem(
      "payment-gateway-error",
      502,
      "Payment processing failed",
      "The payment provider could not complete this request. No charge was confirmed.",
    );
  }
  logger.error(context, error);
  return problems.internalError("An unexpected error occurred");
}
