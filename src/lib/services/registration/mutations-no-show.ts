/**
 * Admin no-show write (issue #17) — marks a CONFIRMED registration as
 * NO_SHOW after the event, in a single transaction.
 *
 * Before this mutation existed, `NO_SHOW` was a dead enum value: the
 * dashboard rendered a badge for it and cancel treated it as a recorded
 * outcome, but nothing ever wrote it. A no-show releases the seat the
 * confirmed registrant held, so this mirrors cancel's seat accounting:
 * `registeredCount` is decremented (floor 0) and the longest-waiting
 * WAITLISTED row is promoted into the freed seat when one exists.
 */

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventRegistration } from "@/db/schema";
import { problem, problems } from "@/lib/http";
import { toEventDto, type EventDto } from "../event-write";
import { RegistrationServiceError } from "./errors";
import { toRegistrationDto } from "./mappers";
import type { DbRegistrationStatus, RegistrationDto } from "./types";

/**
 * Admin no-show: marks a CONFIRMED registration as NO_SHOW and releases
 * its seat (promoting the waitlist, exactly like cancel does).
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

    const [marked] = await tx
      .update(eventRegistration)
      .set({ status: "NO_SHOW" })
      .where(eq(eventRegistration.id, registration.id))
      .returning();

    // A no-show frees the seat the confirmed registrant held. Mirror the
    // cancel path: decrement with a floor, then promote the waitlist.
    await tx
      .update(event)
      .set({ registeredCount: sql`GREATEST(${event.registeredCount} - 1, 0)` })
      .where(eq(event.id, eventId));

    let promoted: RegistrationDto | null = null;
    const [next] = await tx
      .select()
      .from(eventRegistration)
      .where(
        and(eq(eventRegistration.eventId, eventId), eq(eventRegistration.status, "WAITLISTED")),
      )
      .orderBy(asc(eventRegistration.registeredAt), asc(eventRegistration.id))
      .limit(1);

    if (next) {
      const promotedStatus: DbRegistrationStatus = eventRow.requiresApproval
        ? "PENDING"
        : "CONFIRMED";
      const [promotedRow] = await tx
        .update(eventRegistration)
        .set({ status: promotedStatus })
        .where(eq(eventRegistration.id, next.id))
        .returning();
      await tx
        .update(event)
        .set({
          waitlistCount: sql`GREATEST(${event.waitlistCount} - 1, 0)`,
          registeredCount: sql`${event.registeredCount} + 1`,
        })
        .where(eq(event.id, eventId));
      promoted = toRegistrationDto(promotedRow);
    }

    return { registration: toRegistrationDto(marked), event: toEventDto(eventRow), promoted };
  });
}
