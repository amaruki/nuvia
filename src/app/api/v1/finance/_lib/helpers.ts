/**
 * Shared helpers for the /api/v1/finance routes (backlog C2 + C3).
 * - one error→RFC 9457 mapping for the finance services,
 * - one actor builder (audit context from the request),
 * - one tolerant JSON body parser (lifecycle actions accept an empty body).
 */

import type { NextRequest, NextResponse } from "next/server";
import { resolveClientIpOrUndefined } from "@/lib/client-ip";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import { problem, problems, problemResponse, type ProblemDetails } from "@/lib/http";
import { logger } from "@/lib/logger";
import type { ActorContext } from "@/lib/services/subscription.service";

/** Business-rule violations that collide with current resource state map to 409. */
const CONFLICT_CODES: Record<string, true> = {
  INVALID_TRANSITION: true,
  SUBSCRIPTION_ALREADY_ACTIVE: true,
  SUBSCRIPTION_STILL_ENTITLED: true,
  TIER_NAME_TAKEN: true,
  TIER_IN_USE: true,
  TIER_INACTIVE: true,
  // C3: invoice/payment state collisions
  INVOICE_NOT_PAYABLE: true,
  INVOICE_NOT_VOIDABLE: true,
  OVERPAYMENT_NOT_ALLOWED: true,
  // Issue #27: same payment recorded twice is a conflict, not a 500
  DONATION_DUPLICATE_TRANSACTION: true,
};

export function problemFromFinanceError(error: unknown, context: string): ProblemDetails {
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

/** Audit context for the subscription engine: acting user + request origin. */
export function actorFromRequest(
  userId: string,
  request: NextRequest,
  reason?: string,
): ActorContext {
  return {
    actorId: userId,
    reason,
    // Issue #3: trusted-hop resolution; undefined keeps the column's
    // previous "absent" semantics for direct calls without headers.
    ipAddress: resolveClientIpOrUndefined(request.headers),
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

/**
 * Lifecycle actions are POSTs that may carry no body at all — treat an empty
 * body as `{}` instead of failing JSON parsing.
 */
export async function parseOptionalJsonBody(
  request: NextRequest,
): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  const text = await request.text();
  if (text.length === 0) return { ok: true, body: {} };

  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      response: problemResponse(problem("invalid-json", 400, "Invalid JSON body")),
    };
  }
}
