/**
 * Shared fixtures for the events read path integration tests (backlog B2),
 * split out of the former tests/events-read-api.test.ts (see the sibling
 * *.test.ts files). Each call to createEventsReadFixtures() returns a fresh
 * run-suffix-isolated context — seed helpers plus a teardown that removes
 * everything the calling file created — so each part re-creates its own
 * state and stays self-cleaning when bun runs all files in one process.
 *
 * Requires DATABASE_URL to point at a reachable Postgres instance.
 */
import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventCategory, eventRegistration, user } from "@/db/schema";
import { type ListEventsParams } from "@/lib/services/event-read.service";

export interface SeedEventOptions {
  title?: string;
  description?: string;
  status?: NonNullable<ListEventsParams["status"]>[number];
  type?: NonNullable<ListEventsParams["type"]>[number];
  format?: NonNullable<ListEventsParams["format"]>[number];
  visibility?: NonNullable<ListEventsParams["visibility"]>[number];
  startTime?: Date;
  endTime?: Date;
  capacity?: number;
  tags?: string[];
  isVirtual?: boolean;
}

export function createEventsReadFixtures() {
  const runSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const searchToken = `b2-read-${runSuffix}`;

  const createdUserIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdEventIds: string[] = [];
  const createdRegistrationIds: string[] = [];

  let userCounter = 0;
  let eventCounter = 0;

  async function createOrganizer(label: string): Promise<string> {
    userCounter += 1;
    const name = `b2-events-${label}-${userCounter}-${runSuffix}`;
    const [row] = await db
      .insert(user)
      .values({
        username: name,
        email: `${name}@example.test`,
        name: "B2 Events Read Test",
        role: "member",
        emailVerified: false,
      })
      .returning({ id: user.id });
    createdUserIds.push(row.id);
    return row.id;
  }

  async function createCategory(label: string): Promise<string> {
    const [row] = await db
      .insert(eventCategory)
      .values({
        name: `B2 ${label} ${runSuffix}`,
      })
      .returning({ id: eventCategory.id });
    createdCategoryIds.push(row.id);
    return row.id;
  }

  async function createEvent(
    organizerId: string,
    categoryId: string,
    options: SeedEventOptions = {},
  ): Promise<string> {
    eventCounter += 1;
    const [row] = await db
      .insert(event)
      .values({
        title: options.title ?? `${searchToken} Event ${eventCounter}`,
        slug: `${searchToken}-${eventCounter}`.toLowerCase(),
        description: options.description ?? "Seeded by tests/events-read-api/",
        categoryId,
        type: options.type ?? "CONFERENCE",
        format: options.format ?? "IN_PERSON",
        status: options.status ?? "PUBLISHED",
        visibility: options.visibility ?? "PUBLIC",
        capacity: options.capacity,
        isVirtual: options.isVirtual ?? false,
        timezone: "UTC",
        startTime: options.startTime ?? new Date("2026-06-01T10:00:00.000Z"),
        endTime: options.endTime ?? new Date("2026-06-01T18:00:00.000Z"),
        createdBy: organizerId,
        tags: options.tags ?? [],
      })
      .returning({ id: event.id });
    createdEventIds.push(row.id);
    return row.id;
  }

  async function createRegistration(
    userId: string,
    eventId: string,
    status: "PENDING" | "CONFIRMED" | "CANCELED" = "CONFIRMED",
  ): Promise<string> {
    const [row] = await db
      .insert(eventRegistration)
      .values({ userId, eventId, status })
      .returning({ id: eventRegistration.id });
    createdRegistrationIds.push(row.id);
    return row.id;
  }

  /** Deletes every row the importing test file seeded, in FK order. */
  async function cleanup(): Promise<void> {
    if (createdRegistrationIds.length > 0) {
      await db
        .delete(eventRegistration)
        .where(inArray(eventRegistration.id, createdRegistrationIds));
      createdRegistrationIds.length = 0;
    }
    if (createdEventIds.length > 0) {
      await db.delete(event).where(inArray(event.id, createdEventIds));
      createdEventIds.length = 0;
    }
    if (createdCategoryIds.length > 0) {
      await db.delete(eventCategory).where(inArray(eventCategory.id, createdCategoryIds));
      createdCategoryIds.length = 0;
    }
    if (createdUserIds.length > 0) {
      await db.delete(user).where(inArray(user.id, createdUserIds));
      createdUserIds.length = 0;
    }
  }

  return {
    runSuffix,
    searchToken,
    createOrganizer,
    createCategory,
    createEvent,
    createRegistration,
    cleanup,
  };
}
