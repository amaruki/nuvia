/**
 * Shared validation — whether an event currently accepts new registrations.
 */

import { problem } from "@/lib/http";
import { RegistrationServiceError } from "./errors";
import type { EventRow } from "./types";

/** Event statuses that accept new registrations. */
const REGISTERABLE_STATUSES: Record<string, true> = {
  PUBLISHED: true,
  REGISTRATION_OPEN: true,
  IN_PROGRESS: true,
};

export function assertEventRegisterable(eventRow: EventRow): void {
  if (!REGISTERABLE_STATUSES[eventRow.status]) {
    throw new RegistrationServiceError(
      problem(
        "business-logic-error",
        400,
        "Business logic error",
        `Event is not open for registration (status: ${eventRow.status})`,
      ),
    );
  }

  const now = new Date();
  if (eventRow.registrationStart && now < eventRow.registrationStart) {
    throw new RegistrationServiceError(
      problem(
        "business-logic-error",
        400,
        "Business logic error",
        `Registration opens ${eventRow.registrationStart.toISOString()}`,
      ),
    );
  }
  if (eventRow.registrationEnd && now > eventRow.registrationEnd) {
    throw new RegistrationServiceError(
      problem(
        "business-logic-error",
        400,
        "Business logic error",
        "Registration for this event has closed",
      ),
    );
  }
}
