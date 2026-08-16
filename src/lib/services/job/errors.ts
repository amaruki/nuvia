import type { ProblemDetails } from "@/lib/http";

export class JobServiceError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "JobServiceError";
  }
}

export const UNIQUE_VIOLATION = "23505";

/** Walk the drizzle-wrapped error cause chain for a postgres error code. */
export function pgErrorCode(error: unknown): string | null {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== null && typeof current === "object"; depth += 1) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") return code;
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}
