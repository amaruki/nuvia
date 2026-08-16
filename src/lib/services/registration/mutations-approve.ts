/**
 * Approval write (issue #16) — moves a PENDING registration to CONFIRMED.
 *
 * Events with `requiresApproval` put new registrations (and waitlist
 * promotions) in PENDING, which already HOLDS a seat. Approval therefore
 * only flips the status; the counters do not move. Without this path
 * PENDING was a permanent dead end: seats rotted, nobody could ever check
 * in, and the event looked "full" with zero attendees.
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventRegistration } from "@/db/schema";
import { problem, problems } from "@/lib/http";
import { toEventDto, type EventDto } from "../event-write";
import { RegistrationServiceError } from "./errors";
import { toRegistrationDto } from "./mappers";
import type { RegistrationDto } from "./types";

/**
 * Approves a PENDING registration (admin only, behind events:manage).
 */
export async function approveRegistration(
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

    if (registration.status === "CONFIRMED" || registration.status === "ATTENDED") {
      throw new RegistrationServiceError(
        problem("conflict", 409, "Conflict", "Registration is already approved"),
      );
    }
    if (registration.status !== "PENDING") {
      throw new RegistrationServiceError(
        problem(
          "business-logic-error",
          400,
          "Business logic error",
          `Only pending registrations can be approved (status: ${registration.status})`,
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

    // PENDING already holds a seat — approval flips the status only;
    // registeredCount / waitlistCount stay untouched.
    const [approved] = await tx
      .update(eventRegistration)
      .set({ status: "CONFIRMED" })
      .where(eq(eventRegistration.id, registration.id))
      .returning();

    return { registration: toRegistrationDto(approved), event: toEventDto(eventRow) };
  });
}
