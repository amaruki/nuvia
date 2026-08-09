/**
 * Cancel write — releases the held seat (or waitlist slot) and promotes
 * the oldest WAITLISTED row when one exists, in a single transaction so
 * `registeredCount` / `waitlistCount` stay consistent with the rows.
 */

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventRegistration } from "@/db/schema";
import { problem, problems } from "@/lib/http";
import { RegistrationServiceError } from "./errors";
import { toRegistrationDto } from "./mappers";
import type { CancelRegistrationActor, DbRegistrationStatus, RegistrationDto } from "./types";

/**
 * Cancels a registration (owner or events:manage). Frees the seat and
 * promotes the oldest WAITLISTED row when one exists.
 */
export async function cancelRegistration(
  eventId: string,
  registrationId: string,
  actor: CancelRegistrationActor,
): Promise<{ registration: RegistrationDto; promoted: RegistrationDto | null }> {
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

    if (registration.userId !== actor.userId && !actor.canManage) {
      throw new RegistrationServiceError(
        problems.insufficientPermission(
          "Only the registrant or an event manager can cancel this registration",
        ),
      );
    }

    if (registration.status === "CANCELED") {
      throw new RegistrationServiceError(
        problem("conflict", 409, "Conflict", "Registration is already canceled"),
      );
    }
    if (registration.status === "ATTENDED" || registration.status === "NO_SHOW") {
      throw new RegistrationServiceError(
        problem(
          "business-logic-error",
          400,
          "Business logic error",
          `Registration cannot be canceled after the outcome was recorded (status: ${registration.status})`,
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

    const [canceled] = await tx
      .update(eventRegistration)
      .set({ status: "CANCELED" })
      .where(eq(eventRegistration.id, registration.id))
      .returning();

    const heldSeat = registration.status === "PENDING" || registration.status === "CONFIRMED";
    if (heldSeat) {
      await tx
        .update(event)
        .set({ registeredCount: sql`GREATEST(${event.registeredCount} - 1, 0)` })
        .where(eq(event.id, eventId));
    } else {
      await tx
        .update(event)
        .set({ waitlistCount: sql`GREATEST(${event.waitlistCount} - 1, 0)` })
        .where(eq(event.id, eventId));
    }

    // Promote the longest-waiting waitlisted registration into the freed
    // seat. Approval-gated events promote to PENDING, others to CONFIRMED.
    let promoted: RegistrationDto | null = null;
    if (heldSeat) {
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
    }

    return { registration: toRegistrationDto(canceled), promoted };
  });
}
