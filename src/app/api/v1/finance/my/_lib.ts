/**
 * Shared plumbing for the member-scoped finance routes (UI-34):
 * - query/body schemas (same pagination conventions as the backoffice),
 * - one error→RFC 9457 mapping that adds the gateway-failure case on top
 *   of the backoffice finance mapping.
 *
 * Own-only filtering is NOT done here — the service filters by the session
 * user's id inside every query (src/lib/services/finance/member-finance.ts).
 */

import { z } from "zod";
import { problem, type ProblemDetails } from "@/lib/http";
import { GatewayError } from "@/lib/payments/gateway";
import { invoiceStatusSchema, limitSchema, pageSchema } from "@/lib/validation/finance.validation";
import { problemFromFinanceError } from "../_lib/helpers";

export { actorFromRequest, parseOptionalJsonBody } from "../_lib/helpers";

/** ?status=&page=&limit= — mirrors the backoffice invoice list query. */
export const memberInvoiceQuerySchema = z.object({
  status: invoiceStatusSchema.optional(),
  page: pageSchema,
  limit: limitSchema,
});

/** Pay-now body: `{ returnUrl?: string }`; an empty body is allowed. */
export const payNowBodySchema = z.object({
  returnUrl: z.string().url().max(2048).optional(),
});

export function problemFromMemberFinanceError(error: unknown, context: string): ProblemDetails {
  if (error instanceof GatewayError) {
    // Same shape as the join funnel: a provider failure is a 502, never a
    // 500, and never reported as a completed payment.
    return problem(
      "payment-gateway-error",
      502,
      "Payment processing failed",
      "The payment provider could not complete this request. No charge was confirmed.",
    );
  }
  return problemFromFinanceError(error, context);
}
