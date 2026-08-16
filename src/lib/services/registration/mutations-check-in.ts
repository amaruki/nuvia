/**
 * Admin check-in write — marks a CONFIRMED registration as ATTENDED, in
 * a single transaction.
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventRegistration } from "@/db/schema";
import { problem, problems } from "@/lib/http";
import { toEventDto, type EventDto } from "../event-write";
import { assertEventAllowsCheckIn } from "./check-in-guards";
import { RegistrationServiceError } from "./errors";
import { toRegistrationDto } from "./mappers";
import type { RegistrationDto } from "./types";

/**
 * Admin check-in: marks a CONFIRMED registration as ATTENDED.
 */
export async function checkInRegistration(
  eventId: string,
  registrationId: string,
): Promise<{ registration: RegistrationDto; event: EventDto }> {
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

    if (registration.status === "ATTENDED") {
      throw new RegistrationServiceError(
        problem("conflict", 409, "Conflict", "Attendee is already checked in"),
      );
    }
    if (registration.status !== "CONFIRMED") {
      throw new RegistrationServiceError(
        problem(
          "business-logic-error",
          400,
          "Business logic error",
          `Only confirmed registrations can be checked in (status: ${registration.status})`,
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

    // Issue #29: admin check-in now enforces the same event-state and
    // window rules as member self-check-in (no check-ins on canceled or
    // long-ended events).
    assertEventAllowsCheckIn(eventRow);

    const [checkedIn] = await tx
      .update(eventRegistration)
      .set({ status: "ATTENDED", checkedInAt: new Date() })
      .where(eq(eventRegistration.id, registration.id))
      .returning();

    return { registration: toRegistrationDto(checkedIn), event: toEventDto(eventRow) };
  });
}
