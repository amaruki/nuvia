/**
 * Server-side event write operations (backlog B3) — create/update/delete
 * against the events tables. Consumed by the POST /api/v1/events and
 * PATCH/DELETE /api/v1/events/[id] route handlers.
 *
 * This module imports the database client, so it must never be imported
 * from client components (same rule as event-read.service.ts).
 *
 * Throws {@link EventWriteError} carrying an RFC 9457 ProblemDetails
 * payload; route handlers map it through `problemResponse`.
 */

import { eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { event, eventCategory } from "@/db/schema";
import {
  eventFormatEnum,
  eventStatusEnum,
  eventTypeEnum,
  eventVisibilityEnum,
} from "@/db/schema/enums";
import { problem, problems, type ProblemDetails } from "@/lib/http";

export class EventWriteError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "EventWriteError";
  }
}

type EventRow = typeof event.$inferSelect;

export type DbEventType = (typeof eventTypeEnum.enumValues)[number];
export type DbEventFormat = (typeof eventFormatEnum.enumValues)[number];
export type DbEventStatus = (typeof eventStatusEnum.enumValues)[number];
export type DbEventVisibility = (typeof eventVisibilityEnum.enumValues)[number];

// ---------------------------------------------------------------------------
// Wire DTO — the stored row with Dates serialized as ISO strings. The read
// path keeps its UI-shaped mapping (event-read.service.ts, backlog B2); the
// write path returns the storage shape so admins see exactly what was saved.
// ---------------------------------------------------------------------------

export interface EventDto {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  categoryId: string;
  type: DbEventType;
  format: DbEventFormat;
  status: DbEventStatus;
  visibility: DbEventVisibility;
  capacity: number | null;
  registeredCount: number;
  waitlistCount: number;
  isVirtual: boolean;
  isFree: boolean;
  price: string | null;
  currency: string;
  location: string | null;
  virtualUrl: string | null;
  timezone: string;
  startTime: string;
  endTime: string;
  registrationStart: string | null;
  registrationEnd: string | null;
  allowWaitlist: boolean;
  requiresApproval: boolean;
  tags: string[];
  metadata: unknown;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function toEventDto(row: EventRow): EventDto {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    shortDescription: row.shortDescription,
    categoryId: row.categoryId,
    type: row.type,
    format: row.format,
    status: row.status,
    visibility: row.visibility,
    capacity: row.capacity,
    registeredCount: row.registeredCount,
    waitlistCount: row.waitlistCount,
    isVirtual: row.isVirtual,
    isFree: row.isFree,
    price: row.price,
    currency: row.currency,
    location: row.location,
    virtualUrl: row.virtualUrl,
    timezone: row.timezone,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime.toISOString(),
    registrationStart: row.registrationStart?.toISOString() ?? null,
    registrationEnd: row.registrationEnd?.toISOString() ?? null,
    allowWaitlist: row.allowWaitlist,
    requiresApproval: row.requiresApproval,
    tags: row.tags,
    metadata: row.metadata,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Request schemas — enum sets are read from the drizzle pgEnum definitions
// so the API vocabulary always matches the database.
// ---------------------------------------------------------------------------

const slugField = z
  .string()
  .trim()
  .min(3)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, digits and dashes");

const eventFields = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  slug: slugField.optional(),
  description: z.string().min(10, "Description must be at least 10 characters").max(20_000),
  shortDescription: z.string().max(500).optional(),
  /** Event category — accepts either the category id or its unique name. */
  category: z.string().trim().min(1, "Category is required"),
  type: z.enum(eventTypeEnum.enumValues),
  format: z.enum(eventFormatEnum.enumValues),
  status: z.enum(eventStatusEnum.enumValues).default("DRAFT"),
  visibility: z.enum(eventVisibilityEnum.enumValues).default("PUBLIC"),
  capacity: z.number().int().positive("Capacity must be a positive integer").nullish(),
  isVirtual: z.boolean().default(false),
  isFree: z.boolean().default(true),
  price: z.number({ error: "Price must be a number" }).nonnegative().max(99_999_999.99).optional(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code")
    .toUpperCase()
    .default("USD"),
  location: z.string().trim().max(500).optional(),
  virtualUrl: z.url({ error: "Virtual URL must be a valid URL" }).optional(),
  timezone: z.string().trim().min(1).default("UTC"),
  startTime: z.coerce.date({ error: "startTime must be a valid date" }),
  endTime: z.coerce.date({ error: "endTime must be a valid date" }),
  registrationStart: z.coerce.date({ error: "registrationStart must be a valid date" }).optional(),
  registrationEnd: z.coerce.date({ error: "registrationEnd must be a valid date" }).optional(),
  allowWaitlist: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createEventSchema = eventFields.superRefine((data, ctx) => {
  if (data.endTime <= data.startTime) {
    ctx.addIssue({
      code: "custom",
      message: "endTime must be after startTime",
      path: ["endTime"],
    });
  }
  if (
    data.registrationStart &&
    data.registrationEnd &&
    data.registrationEnd <= data.registrationStart
  ) {
    ctx.addIssue({
      code: "custom",
      message: "registrationEnd must be after registrationStart",
      path: ["registrationEnd"],
    });
  }
  if (!data.isFree && data.price === undefined) {
    ctx.addIssue({
      code: "custom",
      message: "price is required when isFree is false",
      path: ["price"],
    });
  }
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

/**
 * PATCH accepts any subset; counters (registeredCount/waitlistCount) are
 * never user-editable. `category` re-resolves the FK when present.
 */
export const updateEventSchema = eventFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .superRefine((data, ctx) => {
    // Cross-field checks apply only when both sides of a pair are present;
    // pairs straddling the stored row are validated in updateEvent().
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      ctx.addIssue({
        code: "custom",
        message: "endTime must be after startTime",
        path: ["endTime"],
      });
    }
    if (
      data.registrationStart &&
      data.registrationEnd &&
      data.registrationEnd <= data.registrationStart
    ) {
      ctx.addIssue({
        code: "custom",
        message: "registrationEnd must be after registrationStart",
        path: ["registrationEnd"],
      });
    }
  });

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolves a category reference (id first, then unique name) to its row. */
async function resolveCategory(reference: string): Promise<{ id: string } | null> {
  const byId = await db
    .select({ id: eventCategory.id })
    .from(eventCategory)
    .where(eq(eventCategory.id, reference))
    .limit(1);
  if (byId.length > 0) return byId[0];

  const [byName] = await db
    .select({ id: eventCategory.id })
    .from(eventCategory)
    .where(or(eq(eventCategory.name, reference), ilike(eventCategory.name, reference)))
    .limit(1);
  return byName ?? null;
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 180) || "event"
  );
}

/** Generates a unique slug from the title, appending -2, -3, … on collision. */
async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  const exists = async (slug: string) =>
    (await db.select({ id: event.id }).from(event).where(eq(event.slug, slug)).limit(1)).length > 0;

  if (!(await exists(base))) return base;
  for (let attempt = 2; attempt <= 25; attempt += 1) {
    const candidate = `${base}-${attempt}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new EventWriteError(
    problem("conflict", 409, "Conflict", `Could not derive a unique slug from "${title}"`),
  );
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: string }).code === "23505"
  );
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

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
