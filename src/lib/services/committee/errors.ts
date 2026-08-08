import { BusinessLogicError } from "@/lib/errors";

// ---------------------------------------------------------------------------
// DB error mapping (mirrors membership-tier.service.ts)
// ---------------------------------------------------------------------------

export const UNIQUE_VIOLATION = "23505";
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export function throwUniqueNameViolation(name: string): never {
  throw new BusinessLogicError(
    `A committee named "${name}" already exists`,
    "COMMITTEE_NAME_TAKEN",
  );
}
