/**
 * Shared helpers for the /api/v1/membership-applications routes (UI-33):
 * request schemas, the error→RFC 9457 mapping (application-specific
 * conflict codes map to 409), and the audit-actor builder.
 */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import { problems, type ProblemDetails } from "@/lib/http";
import { logger } from "@/lib/logger";
import type { ActorContext } from "@/lib/services/subscription.service";

export const createApplicationSchema = z.object({
  tierId: z.string().uuid("Invalid tier ID"),
  name: z.string().trim().min(1).max(200),
  email: z.email("Please enter a valid email address").max(320),
  organization: z.string().trim().max(200).nullish(),
  message: z.string().trim().max(2000).nullish(),
});

export const listApplicationsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const reviewApplicationSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().trim().max(2000).nullish(),
});

/** Application-state collisions map to 409; everything else follows the finance mapping. */
const CONFLICT_CODES: Record<string, true> = {
  APPLICATION_DUPLICATE: true,
  APPLICATION_ALREADY_REVIEWED: true,
};

export function problemFromApplicationError(error: unknown, context: string): ProblemDetails {
  if (error instanceof NotFoundError) {
    return problems.notFound(error.message);
  }
  if (error instanceof BusinessLogicError) {
    return CONFLICT_CODES[error.code] === true
      ? problems.conflict(error.message)
      : problems.businessLogicError(error.message);
  }
  logger.error(context, error);
  return problems.internalError("An unexpected error occurred");
}

/** Audit context for the review mutation: acting reviewer + request origin. */
export function actorFromRequest(
  userId: string,
  request: NextRequest,
  reason?: string,
): ActorContext {
  return {
    actorId: userId,
    reason,
    ipAddress:
      request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}
