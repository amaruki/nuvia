/**
 * Extract a postgres error code. drizzle wraps the driver error in
 * DrizzleQueryError, so walk the cause chain until a code surfaces.
 */
export function pgErrorCode(error: unknown): string | null {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== null && typeof current === "object"; depth += 1) {
    if ("code" in current && typeof current.code === "string") return current.code;
    current = "cause" in current ? (current as { cause?: unknown }).cause : null;
  }
  return null;
}

export class ContentApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    /** RFC 9457 problem slug, resolved against APP_URL by src/lib/http.ts. */
    public readonly slug: string,
    public readonly title: string,
  ) {
    super(message);
    this.name = "ContentApiError";
  }

  static notFound(what = "Content"): ContentApiError {
    return new ContentApiError(`${what} not found`, 404, "not-found", "Not found");
  }

  static conflict(message: string): ContentApiError {
    return new ContentApiError(message, 409, "conflict", "Conflict");
  }

  static internal(): ContentApiError {
    return new ContentApiError(
      "An unexpected error occurred",
      500,
      "internal-error",
      "Internal server error",
    );
  }
}
