/**
 * Server-side registration lifecycle (backlog B3) — register, cancel,
 * check-in, and the admin registration list for one event. Consumed by the
 * /api/v1/events/[id]/registrations route handlers.
 *
 * This module imports the database client, so it must never be imported
 * from client components.
 *
 * Seat accounting: `event.registeredCount` counts registrations that hold a
 * seat (PENDING/CONFIRMED/ATTENDED); `event.waitlistCount` counts
 * WAITLISTED rows. Canceling a seat-holding registration promotes the
 * oldest WAITLISTED row when one exists. CANCELED rows are re-used on
 * re-registration so the (user_id, event_id) pair keeps a single row.
 *
 * Throws {@link RegistrationServiceError} carrying an RFC 9457
 * ProblemDetails payload; route handlers map it through `problemResponse`.
 */

import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { event, eventRegistration, user } from "@/db/schema";
import { registrationStatusEnum } from "@/db/schema/enums";
import { problem, problems, type ProblemDetails } from "@/lib/http";
import { toEventDto, type EventDto } from "./event-write.service";

export class RegistrationServiceError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "RegistrationServiceError";
  }
}

type EventRow = typeof event.$inferSelect;
type RegistrationRow = typeof eventRegistration.$inferSelect;

export type DbRegistrationStatus = (typeof registrationStatusEnum.enumValues)[number];

// ---------------------------------------------------------------------------
// Wire DTOs
// ---------------------------------------------------------------------------

export interface RegistrationUserDto {
  id: string;
  name: string;
  username: string;
  email: string;
  displayName: string | null;
}

export interface RegistrationDto {
  id: string;
  eventId: string;
  userId: string;
  status: DbRegistrationStatus;
  registeredAt: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  /** Present on admin list results (hydrated from the users table). */
  user?: RegistrationUserDto;
}

function toRegistrationDto(row: RegistrationRow, userInfo?: RegistrationUserDto): RegistrationDto {
  return {
    id: row.id,
    eventId: row.eventId,
    userId: row.userId,
    status: row.status,
    registeredAt: row.registeredAt.toISOString(),
    checkedInAt: row.checkedInAt?.toISOString() ?? null,
    checkedOutAt: row.checkedOutAt?.toISOString() ?? null,
    notes: ((row.metadata as { notes?: string } | null)?.notes ?? null) as string | null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(userInfo ? { user: userInfo } : {}),
  };
}

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------

export const createRegistrationSchema = z.object({
  notes: z.string().trim().max(2_000, "Notes must be at most 2,000 characters").optional(),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;

export const listRegistrationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.array(z.enum(registrationStatusEnum.enumValues)).min(1).optional(),
  search: z.string().trim().min(1).max(200).optional(),
});

export type ListRegistrationsQuery = z.infer<typeof listRegistrationsQuerySchema>;

export interface RegistrationListResult {
  registrations: RegistrationDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Shared validation
// ---------------------------------------------------------------------------

/** Event statuses that accept new registrations. */
const REGISTERABLE_STATUSES = new Set(["PUBLISHED", "REGISTRATION_OPEN", "IN_PROGRESS"]);

function assertEventRegisterable(eventRow: EventRow): void {
  if (!REGISTERABLE_STATUSES.has(eventRow.status)) {
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

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

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

export interface CancelRegistrationActor {
  userId: string;
  /** True when the caller holds events:manage — may cancel any registration. */
  canManage: boolean;
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

/**
 * Admin list of an event's registrations with attendee info, filtering and
 * pagination. Search matches user name, username or email.
 */
export async function listRegistrations(
  eventId: string,
  query: ListRegistrationsQuery,
): Promise<RegistrationListResult> {
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(eventRegistration.eventId, eventId)];
  if (query.status?.length) conditions.push(inArray(eventRegistration.status, query.status));
  if (query.search) {
    const term = `%${query.search}%`;
    conditions.push(
      or(ilike(user.name, term), ilike(user.username, term), ilike(user.email, term))!,
    );
  }
  const where = and(...conditions);

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        registration: eventRegistration,
        userName: user.name,
        userUsername: user.username,
        userEmail: user.email,
        userDisplayName: user.displayName,
      })
      .from(eventRegistration)
      .innerJoin(user, eq(eventRegistration.userId, user.id))
      .where(where)
      .orderBy(desc(eventRegistration.registeredAt), asc(eventRegistration.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(eventRegistration)
      .innerJoin(user, eq(eventRegistration.userId, user.id))
      .where(where),
  ]);

  const total = totalResult[0]?.value ?? 0;

  return {
    registrations: rows.map((row) =>
      toRegistrationDto(row.registration, {
        id: row.registration.userId,
        name: row.userName,
        username: row.userUsername,
        email: row.userEmail,
        displayName: row.userDisplayName,
      }),
    ),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
