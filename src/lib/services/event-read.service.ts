/**
 * Server-side event read queries (backlog B2).
 *
 * Shared core behind GET /api/v1/events, GET /api/v1/events/[id], and the
 * public events page, which reads these functions directly because a server
 * component cannot hold an authenticated client session.
 *
 * This module imports the database client, so it must never be imported from
 * client components. The client-side counterpart (src/lib/services/event/)
 * reaches the same data over the API via fetch.
 */

import { and, asc, count, desc, eq, gte, ilike, inArray, lte, ne, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { event, eventCategory, eventRegistration } from "@/db/schema";
import type { EventCategory as EventCategoryRow } from "@/db/schema";
import {
  eventFormatEnum,
  eventStatusEnum,
  eventTypeEnum,
  eventVisibilityEnum,
} from "@/db/schema/enums";
import {
  DB_TO_UI_EVENT_STATUS,
  DB_TO_UI_EVENT_TYPE,
  DB_TO_UI_REGISTRATION_STATUS,
  getRegistrationWindowState,
} from "@/lib/utils/event-utils";
import {
  Event as UiEvent,
  EventRegistration as UiEventRegistration,
  RegistrationStatus,
} from "@/types/event";

// Drizzle select-row shapes for the tables this module reads.
type EventSelect = typeof event.$inferSelect;
type EventRegistrationSelect = typeof eventRegistration.$inferSelect;

/**
 * Query schema for GET /api/v1/events.
 *
 * Lives here, not in src/lib/validation/event.validation.ts, because it is
 * built from the drizzle enum definitions — that validation file is imported
 * by client components and must stay free of schema imports.
 */
export const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(200).optional(),
  categoryId: z.string().trim().min(1).optional(),
  status: z.array(z.enum(eventStatusEnum.enumValues)).min(1).optional(),
  type: z.array(z.enum(eventTypeEnum.enumValues)).min(1).optional(),
  format: z.array(z.enum(eventFormatEnum.enumValues)).min(1).optional(),
  visibility: z.array(z.enum(eventVisibilityEnum.enumValues)).min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  createdBy: z.string().trim().min(1).optional(),
  isVirtual: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  tags: z.array(z.string().trim().min(1)).min(1).optional(),
  sortBy: z.enum(["startTime", "createdAt"]).default("startTime"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

export type EventSortField = "startTime" | "createdAt";
export type EventSortOrder = "asc" | "desc";

export interface ListEventsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: (typeof eventStatusEnum.enumValues)[number][];
  type?: (typeof eventTypeEnum.enumValues)[number][];
  format?: (typeof eventFormatEnum.enumValues)[number][];
  visibility?: (typeof eventVisibilityEnum.enumValues)[number][];
  startDate?: Date;
  endDate?: Date;
  createdBy?: string;
  isVirtual?: boolean;
  tags?: string[];
  sortBy?: EventSortField;
  sortOrder?: EventSortOrder;
}

export interface EventListResult {
  events: UiEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventDetailResult {
  event: UiEvent;
  category: EventCategoryRow | null;
  isRegistered: boolean;
  registration?: UiEventRegistration;
  organizerEvents: UiEvent[];
  similarEvents: UiEvent[];
}

/** Maps a database event row to the UI Event shape. */
export function toUiEvent(row: EventSelect): UiEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    shortDescription: row.shortDescription ?? undefined,
    eventType: DB_TO_UI_EVENT_TYPE[row.type],
    status: DB_TO_UI_EVENT_STATUS[row.status],
    startDate: row.startTime,
    endDate: row.endTime,
    location: row.location ?? "",
    virtualEventUrl: row.virtualUrl ?? undefined,
    isVirtual: row.isVirtual,
    isInPerson: row.format === "IN_PERSON" || row.format === "HYBRID",
    maxAttendees: row.capacity ?? undefined,
    currentAttendees: row.registeredCount,
    registrationDeadline: row.registrationEnd ?? undefined,
    registrationWindow: getRegistrationWindowState(
      row.status,
      row.startTime,
      row.registrationEnd ?? undefined,
    ),
    organizerId: row.createdBy,
    tags: row.tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Maps a database registration row to the UI EventRegistration shape. */
export function toUiRegistration(row: EventRegistrationSelect): UiEventRegistration {
  return {
    id: row.id,
    eventId: row.eventId,
    userId: row.userId,
    status: DB_TO_UI_REGISTRATION_STATUS[row.status] ?? RegistrationStatus.PENDING,
    registeredAt: row.registeredAt,
    checkedInAt: row.checkedInAt ?? undefined,
    // Certificates are not modeled in the schema yet (backlog B3+).
    certificateIssued: false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Postgres array overlap (`&&`) against the tags column. Each tag is bound
 * as its own parameter inside an explicit ARRAY constructor — binding a JS
 * array directly through drizzle reaches the driver as a flat string.
 */
function tagsOverlap(tags: string[]): SQL {
  return sql`${event.tags} && ARRAY[${sql.join(
    tags.map((tag) => sql`${tag}`),
    sql`, `,
  )}]::text[]`;
}

/**
 * Lists events with filtering, sorting, and pagination.
 * `startDate`/`endDate` bound the event start time.
 */
export async function listEvents(params: ListEventsParams = {}): Promise<EventListResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const sortBy = params.sortBy ?? "startTime";
  const sortOrder = params.sortOrder ?? "asc";

  const conditions: SQL[] = [];

  if (params.search) {
    const term = `%${params.search}%`;
    const searchCondition = or(
      ilike(event.title, term),
      ilike(event.description, term),
      ilike(event.location, term),
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  if (params.categoryId) conditions.push(eq(event.categoryId, params.categoryId));
  if (params.status?.length) conditions.push(inArray(event.status, params.status));
  if (params.type?.length) conditions.push(inArray(event.type, params.type));
  if (params.format?.length) conditions.push(inArray(event.format, params.format));
  if (params.visibility?.length) conditions.push(inArray(event.visibility, params.visibility));
  if (params.startDate) conditions.push(gte(event.startTime, params.startDate));
  if (params.endDate) conditions.push(lte(event.startTime, params.endDate));
  if (params.createdBy) conditions.push(eq(event.createdBy, params.createdBy));
  if (params.isVirtual !== undefined) conditions.push(eq(event.isVirtual, params.isVirtual));
  if (params.tags?.length) conditions.push(tagsOverlap(params.tags));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const sortDirection = sortOrder === "desc" ? desc : asc;
  const sortColumn = sortBy === "createdAt" ? event.createdAt : event.startTime;

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(event)
      .where(whereClause)
      .orderBy(sortDirection(sortColumn))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ value: count() }).from(event).where(whereClause),
  ]);

  const total = totalResult[0]?.value ?? 0;

  return {
    events: rows.map(toUiEvent),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Loads one event with everything the detail view needs: its category, the
 * viewer's registration state, other events by the same organizer, and
 * similar events (same category or overlapping tags).
 * Returns null when the event does not exist.
 */
export async function getEventDetail(
  eventId: string,
  viewerId?: string,
): Promise<EventDetailResult | null> {
  const [row] = await db.select().from(event).where(eq(event.id, eventId)).limit(1);
  if (!row) return null;

  const categoryRows = row.categoryId
    ? await db.select().from(eventCategory).where(eq(eventCategory.id, row.categoryId)).limit(1)
    : [];

  let isRegistered = false;
  let registration: UiEventRegistration | undefined;
  if (viewerId) {
    const registrationRows = await db
      .select()
      .from(eventRegistration)
      .where(and(eq(eventRegistration.eventId, eventId), eq(eventRegistration.userId, viewerId)));
    // A canceled registration does not count as registered.
    const activeRegistration = registrationRows.find((r) => r.status !== "CANCELED");
    if (activeRegistration) {
      isRegistered = true;
      registration = toUiRegistration(activeRegistration);
    }
  }

  const organizerRows = await db
    .select()
    .from(event)
    .where(and(eq(event.createdBy, row.createdBy), ne(event.id, eventId)))
    .orderBy(desc(event.startTime))
    .limit(5);

  const similarMatches: SQL[] = [];
  if (row.categoryId) similarMatches.push(eq(event.categoryId, row.categoryId));
  if (row.tags.length > 0) similarMatches.push(tagsOverlap(row.tags));
  const similarRows =
    similarMatches.length > 0
      ? await db
          .select()
          .from(event)
          // Self-exclusion ANDs with the match criteria — an OR here would
          // let the event back in through its own category/tags.
          .where(and(ne(event.id, eventId), or(...similarMatches)))
          .orderBy(desc(event.startTime))
          .limit(4)
      : [];

  return {
    event: toUiEvent(row),
    category: categoryRows[0] ?? null,
    isRegistered,
    registration,
    organizerEvents: organizerRows.map(toUiEvent),
    similarEvents: similarRows.map(toUiEvent),
  };
}
