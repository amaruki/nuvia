/**
 * Chapter service errors — every failure throws ChapterServiceError
 * carrying an RFC 9457 problem; the /api/v1/chapters routes map it via
 * handleChapterRoute.
 */

import type { ProblemDetails } from "@/lib/http";

export class ChapterServiceError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "ChapterServiceError";
  }
}

export const UNIQUE_VIOLATION = "23505";

export function pgErrorCode(error: unknown): string | null {
  // drizzle wraps the driver error in DrizzleQueryError, so walk the cause
  // chain until a postgres error code surfaces.
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== null && typeof current === "object"; depth += 1) {
    if ("code" in current && typeof current.code === "string") return current.code;
    current = "cause" in current ? current.cause : null;
  }
  return null;
}
