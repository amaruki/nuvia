/**
 * Event write service errors — every failure throws EventWriteError carrying
 * an RFC 9457 problem; the /api/v1/events routes map it via
 * handleEventRoute (src/app/api/v1/events/_lib.ts).
 */

import type { ProblemDetails } from "@/lib/http";

export class EventWriteError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "EventWriteError";
  }
}

/** True when the driver error carries the postgres unique_violation code. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: string }).code === "23505"
  );
}
