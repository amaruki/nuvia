/**
 * Event writes — create/update/delete with category resolution, slug
 * uniqueness (23505 -> 409) and cross-patch chronology checks.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { event } from "@/db/schema";
import { problem, problems } from "@/lib/http";
import { EventWriteError, isUniqueViolation } from "./errors";
import { generateUniqueSlug, resolveCategory } from "./helpers";
import { EVENT_STATUS_TRANSITIONS } from "./lifecycle";
import { toEventDto } from "./mappers";
import type { CreateEventInput, UpdateEventInput } from "./schemas";
import type { EventDto } from "./types";

export async function createEvent(input: CreateEventInput, createdBy: string): Promise<EventDto> {
  const category = await resolveCategory(input.category);
  if (!category) {
    throw new EventWriteError(
      problem("validation-error", 422, "Validation failed", "Referenced category does not exist", {
        errors: [{ field: "category", message: `No event category matches "${input.category}"` }],
      }),
    );
  }

  let slug: string;
  if (input.slug) {
    const taken = await db
      .select({ id: event.id })
      .from(event)
      .where(eq(event.slug, input.slug))
      .limit(1);
    if (taken.length > 0) {
      throw new EventWriteError(
        problem("conflict", 409, "Conflict", `Slug "${input.slug}" is already in use`),
      );
    }
    slug = input.slug;
  } else {
    slug = await generateUniqueSlug(input.title);
  }

  try {
    const [row] = await db
      .insert(event)
      .values({
        title: input.title,
        slug,
        description: input.description,
        shortDescription: input.shortDescription,
        categoryId: category.id,
        type: input.type,
        format: input.format,
        status: input.status,
        visibility: input.visibility,
        capacity: input.capacity ?? null,
        isVirtual: input.isVirtual,
        isFree: input.isFree,
        price: input.isFree ? null : String(input.price),
        currency: input.currency,
        location: input.location,
        virtualUrl: input.virtualUrl,
        timezone: input.timezone,
        startTime: input.startTime,
        endTime: input.endTime,
        registrationStart: input.registrationStart,
        registrationEnd: input.registrationEnd,
        allowWaitlist: input.allowWaitlist,
        requiresApproval: input.requiresApproval,
        tags: input.tags,
        metadata: input.metadata ?? null,
        createdBy,
      })
      .returning();
    return toEventDto(row);
  } catch (error) {
    // Concurrent insert won the slug race — the DB unique index is the
    // source of truth (the pre-check above is an optimization only).
    if (isUniqueViolation(error)) {
      throw new EventWriteError(
        problem("conflict", 409, "Conflict", `Slug "${slug}" is already in use`),
      );
    }
    throw error;
  }
}

export async function updateEvent(id: string, input: UpdateEventInput): Promise<EventDto> {
  const [existing] = await db.select().from(event).where(eq(event.id, id)).limit(1);
  if (!existing) {
    throw new EventWriteError(problems.notFound(`Event ${id} not found`));
  }

  // Issue #29 (finding 5): status changes follow the lifecycle table.
  // Setting the same status again is a no-op (forms resend the whole
  // payload); anything else must be a legal transition.
  if (input.status !== undefined && input.status !== existing.status) {
    const allowed = EVENT_STATUS_TRANSITIONS[existing.status];
    if (!allowed.includes(input.status)) {
      throw new EventWriteError(
        problem(
          "conflict",
          409,
          "Conflict",
          `Cannot transition event from ${existing.status} to ${input.status}`,
        ),
      );
    }
  }

  // Issue #29 (finding 6): capacity can never drop below the number of
  // confirmed registrations — the excess would be silently overbooked with
  // no way to tell who is over the limit.
  if (
    input.capacity !== undefined &&
    input.capacity !== null &&
    input.capacity < existing.registeredCount
  ) {
    throw new EventWriteError(
      problem("validation-error", 422, "Validation failed", undefined, {
        errors: [
          {
            field: "capacity",
            message: `Capacity cannot be lower than the current registration count (${existing.registeredCount})`,
          },
        ],
      }),
    );
  }

  let categoryId = existing.categoryId;
  if (input.category !== undefined) {
    const category = await resolveCategory(input.category);
    if (!category) {
      throw new EventWriteError(
        problem(
          "validation-error",
          422,
          "Validation failed",
          "Referenced category does not exist",
          {
            errors: [
              { field: "category", message: `No event category matches "${input.category}"` },
            ],
          },
        ),
      );
    }
    categoryId = category.id;
  }

  // Chronology across the patch boundary (e.g. only endTime provided).
  const mergedStart = input.startTime ?? existing.startTime;
  const mergedEnd = input.endTime ?? existing.endTime;
  if (mergedEnd <= mergedStart) {
    throw new EventWriteError(
      problem("validation-error", 422, "Validation failed", undefined, {
        errors: [{ field: "endTime", message: "endTime must be after startTime" }],
      }),
    );
  }

  const updates: Partial<typeof event.$inferInsert> = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
    ...(categoryId !== existing.categoryId ? { categoryId } : {}),
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.format !== undefined ? { format: input.format } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
    ...(input.capacity !== undefined ? { capacity: input.capacity ?? null } : {}),
    ...(input.isVirtual !== undefined ? { isVirtual: input.isVirtual } : {}),
    ...(input.isFree !== undefined ? { isFree: input.isFree } : {}),
    ...(input.price !== undefined ? { price: String(input.price) } : {}),
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    ...(input.location !== undefined ? { location: input.location } : {}),
    ...(input.virtualUrl !== undefined ? { virtualUrl: input.virtualUrl } : {}),
    ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
    ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
    ...(input.registrationStart !== undefined
      ? { registrationStart: input.registrationStart }
      : {}),
    ...(input.registrationEnd !== undefined ? { registrationEnd: input.registrationEnd } : {}),
    ...(input.allowWaitlist !== undefined ? { allowWaitlist: input.allowWaitlist } : {}),
    ...(input.requiresApproval !== undefined ? { requiresApproval: input.requiresApproval } : {}),
    ...(input.tags !== undefined ? { tags: input.tags } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
  };

  // A paid event must keep a price — turning isFree off without a price is a
  // business error, mirroring the create-time rule.
  const willBeFree = input.isFree ?? existing.isFree;
  const willHavePrice = input.price !== undefined ? true : existing.price !== null;
  if (!willBeFree && !willHavePrice) {
    throw new EventWriteError(
      problem("validation-error", 422, "Validation failed", undefined, {
        errors: [{ field: "price", message: "price is required when isFree is false" }],
      }),
    );
  }

  // Slug changes are explicit only; titles never rewrite slugs (stable URLs).
  if (input.slug !== undefined && input.slug !== existing.slug) {
    const taken = await db
      .select({ id: event.id })
      .from(event)
      .where(eq(event.slug, input.slug))
      .limit(1);
    if (taken.length > 0) {
      throw new EventWriteError(
        problem("conflict", 409, "Conflict", `Slug "${input.slug}" is already in use`),
      );
    }
    updates.slug = input.slug;
  }

  try {
    const [row] = await db.update(event).set(updates).where(eq(event.id, id)).returning();
    return toEventDto(row);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new EventWriteError(
        problem(
          "conflict",
          409,
          "Conflict",
          `Slug "${updates.slug ?? existing.slug}" is already in use`,
        ),
      );
    }
    throw error;
  }
}

/**
 * Deletes an event. Registrations, speakers, sponsors and sessions cascade
 * via their FK ON DELETE CASCADE clauses.
 */
export async function deleteEvent(id: string): Promise<{ id: string; deleted: boolean }> {
  const deletedRows = await db.delete(event).where(eq(event.id, id)).returning({ id: event.id });
  if (deletedRows.length === 0) {
    throw new EventWriteError(problems.notFound(`Event ${id} not found`));
  }
  return { id, deleted: true };
}
