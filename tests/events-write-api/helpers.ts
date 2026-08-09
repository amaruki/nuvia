/**
 * Shared fixtures and teardown for the events-write-api integration tests
 * (backlog B3), split out of the former tests/events-write-api.test.ts.
 *
 * Every seeded row carries the per-run suffix and is tracked for cleanup.
 * Each test file registers `afterEach(cleanupTrackedRows)`, which deletes the
 * tracked rows in FK order (registrations → events → categories → users).
 * Requires DATABASE_URL to point at a reachable Postgres instance.
 */
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventCategory, eventRegistration, user } from "@/db/schema";
import {
  createEvent,
  EventWriteError,
  type CreateEventInput,
  type EventDto,
} from "@/lib/services/event-write";
import {
  RegistrationServiceError,
  type DbRegistrationStatus,
} from "@/lib/services/registration.service";

export const runSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createdUserIds: string[] = [];
const createdCategoryIds: string[] = [];
const createdEventIds: string[] = [];
const createdRegistrationIds: string[] = [];

let userCounter = 0;
let categoryCounter = 0;

export function problemStatus(error: unknown): number | undefined {
  if (
    (error instanceof EventWriteError || error instanceof RegistrationServiceError) &&
    typeof error.problemDetails === "object"
  ) {
    return error.problemDetails.status;
  }
  return undefined;
}

export async function createUser(label: string): Promise<string> {
  userCounter += 1;
  const name = `b3-write-${label}-${userCounter}-${runSuffix}`;
  const [row] = await db
    .insert(user)
    .values({
      username: name,
      email: `${name}@example.test`,
      name: "B3 Events Write Test",
      role: "member",
      emailVerified: false,
    })
    .returning({ id: user.id });
  createdUserIds.push(row.id);
  return row.id;
}

export async function createCategory(label: string): Promise<{ id: string; name: string }> {
  categoryCounter += 1;
  const name = `B3 ${label} ${categoryCounter} ${runSuffix}`;
  const [row] = await db.insert(eventCategory).values({ name }).returning({ id: eventCategory.id });
  createdCategoryIds.push(row.id);
  return { id: row.id, name };
}

export function baseEventInput(
  category: string,
  overrides: Partial<CreateEventInput> = {},
): CreateEventInput {
  return {
    title: `B3 Write Test ${runSuffix}`,
    description: "Seeded by tests/events-write-api/",
    category,
    type: "CONFERENCE",
    format: "IN_PERSON",
    status: "PUBLISHED",
    visibility: "PUBLIC",
    isVirtual: false,
    isFree: true,
    currency: "USD",
    timezone: "UTC",
    startTime: new Date("2027-06-01T10:00:00.000Z"),
    endTime: new Date("2027-06-01T18:00:00.000Z"),
    allowWaitlist: true,
    requiresApproval: false,
    tags: [],
    ...overrides,
  };
}

/** Creates an event through the write service and tracks it for cleanup. */
export async function seedEvent(
  organizerId: string,
  category: string,
  overrides: Partial<CreateEventInput> = {},
): Promise<EventDto> {
  const dto = await createEvent(baseEventInput(category, overrides), organizerId);
  createdEventIds.push(dto.id);
  return dto;
}

export function trackRegistration(id: string): string {
  createdRegistrationIds.push(id);
  return id;
}

export async function fetchEventCounters(
  eventId: string,
): Promise<{ registeredCount: number; waitlistCount: number } | undefined> {
  const [row] = await db
    .select({
      registeredCount: event.registeredCount,
      waitlistCount: event.waitlistCount,
    })
    .from(event)
    .where(eq(event.id, eventId))
    .limit(1);
  return row;
}

export async function fetchRegistrationStatus(
  registrationId: string,
): Promise<DbRegistrationStatus | undefined> {
  const [row] = await db
    .select({ status: eventRegistration.status })
    .from(eventRegistration)
    .where(eq(eventRegistration.id, registrationId))
    .limit(1);
  return row?.status;
}

export async function fetchRegistrationMetadata(
  registrationId: string,
): Promise<Record<string, unknown> | null | undefined> {
  const [row] = await db
    .select({ metadata: eventRegistration.metadata })
    .from(eventRegistration)
    .where(eq(eventRegistration.id, registrationId))
    .limit(1);
  return row?.metadata as Record<string, unknown> | null | undefined;
}

/** Deletes every row the importing test file seeded, in FK order. */
export async function cleanupTrackedRows(): Promise<void> {
  if (createdRegistrationIds.length > 0) {
    await db.delete(eventRegistration).where(inArray(eventRegistration.id, createdRegistrationIds));
    createdRegistrationIds.length = 0;
  }
  if (createdEventIds.length > 0) {
    await db.delete(event).where(inArray(event.id, createdEventIds));
    createdEventIds.length = 0;
  }
  if (createdCategoryIds.length > 0) {
    // Safety net: drop any event that still references a tracked category
    // (e.g. a row a negative-path test inserted before throwing), then the
    // categories themselves.
    await db.delete(event).where(inArray(event.categoryId, createdCategoryIds));
    await db.delete(eventCategory).where(inArray(eventCategory.id, createdCategoryIds));
    createdCategoryIds.length = 0;
  }
  if (createdUserIds.length > 0) {
    await db.delete(user).where(inArray(user.id, createdUserIds));
    createdUserIds.length = 0;
  }
}
