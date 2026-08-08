/**
 * Shared helpers for the /api/v1/committees route handlers (backlog D2).
 * - one error→RFC 9457 mapping for the committee service,
 * - pagination / enum-list / count query parsing.
 */

import type { NextResponse } from "next/server";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import { problemResponse, problems, type ProblemDetails } from "@/lib/http";
import { logger } from "@/lib/logger";

/** Business-rule violations that collide with current resource state map to 409. */
const CONFLICT_CODES: Record<string, true> = {
  COMMITTEE_NAME_TAKEN: true,
  COMMITTEE_PARENT_SELF: true,
};

/** Maps committee service errors to RFC 9457 problems; anything else is a 500. */
export function problemFromCommitteeError(error: unknown, context: string): ProblemDetails {
  if (error instanceof NotFoundError) {
    return problems.notFound(error.message);
  }
  if (error instanceof BusinessLogicError) {
    return CONFLICT_CODES[error.code] === true
      ? problems.conflict(error.message)
      : problems.businessLogicError(error.message);
  }
  logger.error(`Unhandled error in ${context}`, error);
  return problems.internalError();
}

export async function handleCommitteeRoute(
  handler: () => Promise<NextResponse>,
  context: string,
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return problemResponse(problemFromCommitteeError(error, context));
  }
}

/** Reads ?page=&limit= with sane bounds (defaults page=1, limit=20). */
export function parsePagination(searchParams: URLSearchParams): { page?: number; limit?: number } {
  const page = Number.parseInt(searchParams.get("page") ?? "", 10);
  const limit = Number.parseInt(searchParams.get("limit") ?? "", 10);
  return {
    page: Number.isFinite(page) && page > 0 ? page : undefined,
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
  };
}

/**
 * Parses a comma-separated enum list param (e.g. ?status=active,pending).
 * Unknown values are dropped; an empty result means "no filter".
 */
export function parseEnumListParam<T extends string>(
  searchParams: URLSearchParams,
  name: string,
  allowed: readonly T[],
): T[] | undefined {
  const raw = searchParams.get(name);
  if (!raw) return undefined;
  const valid = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is T => (allowed as readonly string[]).includes(value));
  return valid.length > 0 ? [...new Set(valid)] : undefined;
}

/** Parses a non-negative integer param; invalid values mean "no filter". */
export function parseCountParam(searchParams: URLSearchParams, name: string): number | undefined {
  const value = Number.parseInt(searchParams.get(name) ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}
