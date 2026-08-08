import type { ProblemDetails } from "@/lib/http";

export class LearningServiceError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "LearningServiceError";
  }
}

export const UNIQUE_VIOLATION = "23505";

export function pgErrorCode(error: unknown): string | null {
  // drizzle wraps the driver error in DrizzleQueryError, so walk the cause
  // chain until a postgres error code surfaces.
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== null && typeof current === "object"; depth += 1) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") return code;
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}
