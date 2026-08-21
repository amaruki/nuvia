/**
 * Admin no-show write (issue #17) — marks a CONFIRMED registration as
 * NO_SHOW after the event, in a single transaction.
 *
 * Before this mutation existed, `NO_SHOW` was a dead enum value: the
 * dashboard rendered a badge for it and cancel treated it as a recorded
 * outcome, but nothing ever wrote it. This post-event reconciliation lowers
 * `registeredCount`. It does not promote the waitlist after the event ends.
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventRegistration } from "@/db/schema";
import { problem, problems } from "@/lib/http";
import { toEventDto, type EventDto } from "../event-write";
import { RegistrationServiceError } from "./errors";
import { toRegistrationDto } from "./mappers";
import type { RegistrationDto } from "./types";

/**
 * Admin no-show: mark a confirmed registration after the event ends.
 */
export async function markNoShowRegistration(
  eventId: string,
  registrationId: string,
): Promise<{ registration: RegistrationDto; event: EventDto; promoted: RegistrationDto | null }> {
  return db.transaction(async (tx) => {
    const [registration] = await tx
      .select()
      .from(eventRegistration)
      .where(and(eq(eventRegistration.id, registrationId), eq(eventRegistration.eventId, eventId)))
      .for("update")
      .limit(1);
    if (!registration) {
      throw new RegistrationServiceError(
        problems.notFound(`Registration ${registrationId} not found for event ${eventId}`),
      );
    }

    if (registration.status === "NO_SHOW") {
      throw new RegistrationServiceError(
        problem("conflict", 409, "Conflict", "Attendee is already marked as a no-show"),
      );
    }
    if (registration.status !== "CONFIRMED") {
      throw new RegistrationServiceError(
        problem(
          "business-logic-error",
          400,
          "Business logic error",
          `Only confirmed registrations can be marked as a no-show (status: ${registration.status})`,
        ),
      );
    }

    const [eventRow] = await tx
      .select()
      .from(event)
      .where(eq(event.id, eventId))
      .for("update")
      .limit(1);
    if (!eventRow) {
      throw new RegistrationServiceError(problems.notFound(`Event ${eventId} not found`));
    }
    if (eventRow.endTime.getTime() > Date.now()) {
      throw new RegistrationServiceError(
        problem(
          "business-logic-error",
          400,
          "Business logic error",
          "An attendee can be marked as a no-show only after the event ends",
        ),
      );
    }

    const [marked] = await tx
      .update(eventRegistration)
      .set({ status: "NO_SHOW" })
      .where(eq(eventRegistration.id, registration.id))
      .returning();

    // Reconcile the final attendance count. The event is over, so waitlisted
    // attendees must not be promoted into a seat they can no longer use.
    await tx
      .update(event)
      .set({ registeredCount: sql`GREATEST(${event.registeredCount} - 1, 0)` })
      .where(eq(event.id, eventId));

    return { registration: toRegistrationDto(marked), event: toEventDto(eventRow), promoted: null };
  });
}
