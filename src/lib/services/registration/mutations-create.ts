/**
 * Self-register write — derives the status (requiresApproval → PENDING;
 * free seat → CONFIRMED; full + allowWaitlist → WAITLISTED) and bumps the
 * seat/waitlist counters in the same transaction so `registeredCount` /
 * `waitlistCount` stay consistent with the registration rows.
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventRegistration } from "@/db/schema";
import { problem, problems } from "@/lib/http";
import { toEventDto, type EventDto } from "../event-write";
import { RegistrationServiceError, UNIQUE_VIOLATION, pgErrorCode } from "./errors";
import { assertEventRegisterable } from "./helpers";
import { toRegistrationDto } from "./mappers";
import type { CreateRegistrationInput } from "./schemas";
import type { DbRegistrationStatus, RegistrationDto } from "./types";

/**
 * Registers the caller for an event.
 *
 * Status assignment: requiresApproval → PENDING; free seat available →
 * CONFIRMED; no seat but allowWaitlist → WAITLISTED; otherwise 400.
 * Paid events are rejected with 501 until payments land (backlog C3).
 */
export async function createRegistration(
  eventId: string,
  userId: string,
  input: CreateRegistrationInput = {},
): Promise<{ registration: RegistrationDto; event: EventDto }> {
  const result = await db
    .transaction(async (tx) => {
      const [eventRow] = await tx
        .select()
        .from(event)
        .where(eq(event.id, eventId))
        .for("update")
        .limit(1);
      if (!eventRow) {
        throw new RegistrationServiceError(problems.notFound(`Event ${eventId} not found`));
      }

      if (!eventRow.isFree) {
        throw new RegistrationServiceError(
          problem(
            "paid-registration-not-implemented",
            501,
            "Paid registration not implemented",
            "This event requires payment. Online payments are not available yet — contact the organizer.",
          ),
        );
      }

      assertEventRegisterable(eventRow);

      const [existing] = await tx
        .select()
        .from(eventRegistration)
        .where(and(eq(eventRegistration.eventId, eventId), eq(eventRegistration.userId, userId)))
        .limit(1);

      if (existing && existing.status !== "CANCELED") {
        throw new RegistrationServiceError(
          problem(
            "conflict",
            409,
            "Conflict",
            `Already registered for this event (status: ${existing.status})`,
          ),
        );
      }

      let status: DbRegistrationStatus;
      if (eventRow.requiresApproval) {
        status = "PENDING";
      } else if (eventRow.capacity === null || eventRow.registeredCount < eventRow.capacity) {
        status = "CONFIRMED";
      } else if (eventRow.allowWaitlist) {
        status = "WAITLISTED";
      } else {
        throw new RegistrationServiceError(
          problem(
            "business-logic-error",
            400,
            "Business logic error",
            "Event is at full capacity and the waitlist is disabled",
          ),
        );
      }

      const registrationValues = {
        status,
        registeredAt: new Date(),
        checkedInAt: null,
        checkedOutAt: null,
        metadata: input.notes ? { notes: input.notes } : null,
      };

      const row =
        existing !== undefined
          ? (
              await tx
                .update(eventRegistration)
                .set(registrationValues)
                .where(eq(eventRegistration.id, existing.id))
                .returning()
            )[0]
          : (
              await tx
                .insert(eventRegistration)
                .values({ ...registrationValues, userId, eventId })
                .returning()
            )[0];

      if (status === "CONFIRMED" || status === "PENDING") {
        await tx
          .update(event)
          .set({ registeredCount: sql`${event.registeredCount} + 1` })
          .where(eq(event.id, eventId));
      } else {
        await tx
          .update(event)
          .set({ waitlistCount: sql`${event.waitlistCount} + 1` })
          .where(eq(event.id, eventId));
      }

      // Re-read the event so the returned DTO reflects the counters bumped
      // above (the initial SELECT was taken before the increment).
      const [updatedEvent] = await tx.select().from(event).where(eq(event.id, eventId)).limit(1);
      return { registration: toRegistrationDto(row), event: toEventDto(updatedEvent) };
    })
    .catch((error) => {
      // Last-line defense (issue #14): the partial unique index vetoes a
      // duplicate that slipped past the in-transaction check. The whole
      // transaction — including the counter bump — rolls back, so surface a
      // clean 409 instead of a raw 500.
      if (pgErrorCode(error) === UNIQUE_VIOLATION) {
        throw new RegistrationServiceError(
          problem("conflict", 409, "Conflict", "Already registered for this event"),
        );
      }
      throw error;
    });

  return result;
}
