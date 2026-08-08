import type { ProblemDetails } from "@/lib/http";

export class AwardServiceError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "AwardServiceError";
  }
}

export const UNIQUE_VIOLATION = "23505";

/**
 * Extract a postgres error code. drizzle wraps the driver error in
 * DrizzleQueryError, so walk the cause chain until a code surfaces.
 */
export function pgErrorCode(error: unknown): string | null {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== null && typeof current === "object"; depth += 1) {
    if ("code" in current && typeof current.code === "string") return current.code;
    current = "cause" in current ? current.cause : null;
  }
  return null;
}
