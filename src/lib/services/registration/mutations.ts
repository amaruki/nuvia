/**
 * Registration writes — self-register (status derivation + seat counters),
 * cancel (seat release + waitlist promotion), and admin check-in. Each
 * operation runs in a single transaction so `registeredCount` /
 * `waitlistCount` stay consistent with the registration rows.
 */

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventRegistration } from "@/db/schema";
import { problem, problems } from "@/lib/http";
import { toEventDto, type EventDto } from "../event-write";
import { RegistrationServiceError } from "./errors";
import { assertEventRegisterable } from "./helpers";
import { toRegistrationDto } from "./mappers";
import type { CreateRegistrationInput } from "./schemas";
import type { CancelRegistrationActor, DbRegistrationStatus, RegistrationDto } from "./types";

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
  const result = await db.transaction(async (tx) => {
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
  });

  return result;
}

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

    const [checkedIn] = await tx
      .update(eventRegistration)
      .set({ status: "ATTENDED", checkedInAt: new Date() })
      .where(eq(eventRegistration.id, registration.id))
      .returning();

    return { registration: toRegistrationDto(checkedIn), event: toEventDto(eventRow) };
  });
}
