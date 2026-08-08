/**
 * Registration service errors — every failure throws RegistrationServiceError
 * carrying an RFC 9457 problem; the /api/v1/events/[id]/registrations routes
 * map it via handleEventRoute.
 */

import type { ProblemDetails } from "@/lib/http";

export class RegistrationServiceError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "RegistrationServiceError";
  }
}
