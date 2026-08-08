/**
 * Integration tests for the events read path (backlog B2).
 *
 * Exercises the server-side read service that backs GET /api/v1/events and
 * GET /api/v1/events/[id] — the same functions the public events page calls
 * directly. The route handlers need a live Next request lifecycle for
 * session auth, so the service core is proven here, the way
 * tests/role-assignment.test.ts proves the role rules.
 *
 * Every row is ID-isolated with a per-run suffix and removed in afterEach
 * (registrations -> events -> categories -> users, matching FK order).
 * Assertions are scoped to the seeded organizer/category so other data in
 * the shared test database cannot interfere.
 *
 * Requires the compose.test.yml stack: bun run test:integration
 */
import { afterEach, describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventCategory, eventRegistration, user } from "@/db/schema";
import {
  getEventDetail,
  listEvents,
  toUiEvent,
  type ListEventsParams,
} from "@/lib/services/event-read.service";
import { EventStatus, EventType, RegistrationStatus } from "@/types/event";

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

interface SeedEventOptions {
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
      description: options.description ?? "Seeded by tests/events-read-api.test.ts",
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

afterEach(async () => {
  if (createdRegistrationIds.length > 0) {
    await db.delete(eventRegistration).where(inArray(eventRegistration.id, createdRegistrationIds));
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
});

describe("listEvents — the service core behind GET /api/v1/events", () => {
  test("returns the organizer's events mapped to the UI shape", async () => {
    const organizerId = await createOrganizer("list");
    const categoryId = await createCategory("list");
    const startTime = new Date("2026-06-01T10:00:00.000Z");
    const publishedId = await createEvent(organizerId, categoryId, {
      status: "PUBLISHED",
      type: "CONFERENCE",
      format: "IN_PERSON",
      capacity: 120,
      startTime,
    });
    await createEvent(organizerId, categoryId, { status: "DRAFT" });

    const result = await listEvents({ createdBy: organizerId });

    expect(result.total).toBe(2);
    expect(result.events).toHaveLength(2);

    const published = result.events.find((e) => e.id === publishedId);
    expect(published).toBeDefined();
    expect(published!.status).toBe(EventStatus.PUBLISHED);
    expect(published!.eventType).toBe(EventType.CONFERENCE);
    expect(published!.startDate).toBeInstanceOf(Date);
    expect(published!.startDate.getTime()).toBe(startTime.getTime());
    expect(published!.currentAttendees).toBe(0);
    expect(published!.maxAttendees).toBe(120);
    expect(published!.isInPerson).toBe(true);
    expect(published!.organizerId).toBe(organizerId);
  });

  test("paginates with page/limit and reports totals", async () => {
    const organizerId = await createOrganizer("page");
    const categoryId = await createCategory("page");

    const ids: string[] = [];
    for (let index = 0; index < 5; index += 1) {
      const day = 10 + index;
      ids.push(
        await createEvent(organizerId, categoryId, {
          startTime: new Date(`2026-06-${String(day).padStart(2, "0")}T09:00:00.000Z`),
          endTime: new Date(`2026-06-${String(day).padStart(2, "0")}T17:00:00.000Z`),
        }),
      );
    }

    const pageOne = await listEvents({ createdBy: organizerId, page: 1, limit: 2 });
    expect(pageOne.events).toHaveLength(2);
    expect(pageOne.total).toBe(5);
    expect(pageOne.totalPages).toBe(3);
    expect(pageOne.page).toBe(1);
    expect(pageOne.limit).toBe(2);
    // Default sort is startTime ascending — earliest first.
    expect(pageOne.events[0].id).toBe(ids[0]);

    const pageThree = await listEvents({ createdBy: organizerId, page: 3, limit: 2 });
    expect(pageThree.events).toHaveLength(1);

    const seen = new Set<string>([
      ...pageOne.events.map((e) => e.id),
      ...(await listEvents({ createdBy: organizerId, page: 2, limit: 2 })).events.map((e) => e.id),
      ...pageThree.events.map((e) => e.id),
    ]);
    expect(seen.size).toBe(5);
  });

  test("filters by search term across title, description, location", async () => {
    const organizerId = await createOrganizer("search");
    const categoryId = await createCategory("search");
    await createEvent(organizerId, categoryId, { title: `${searchToken} Alpha` });
    await createEvent(organizerId, categoryId, { description: `about ${searchToken}` });
    await createEvent(organizerId, categoryId, { title: "Unrelated gathering" });

    const result = await listEvents({ createdBy: organizerId, search: searchToken });

    expect(result.total).toBe(2);
    expect(
      result.events.every(
        (e) => e.title.includes(searchToken) || e.description.includes(searchToken),
      ),
    ).toBe(true);
  });

  test("filters by status using DB enum values", async () => {
    const organizerId = await createOrganizer("status");
    const categoryId = await createCategory("status");
    const draftId = await createEvent(organizerId, categoryId, { status: "DRAFT" });
    const publishedId = await createEvent(organizerId, categoryId, { status: "PUBLISHED" });
    const canceledId = await createEvent(organizerId, categoryId, { status: "CANCELED" });

    const drafts = await listEvents({ createdBy: organizerId, status: ["DRAFT"] });
    expect(drafts.total).toBe(1);
    expect(drafts.events[0].id).toBe(draftId);
    expect(drafts.events[0].status).toBe(EventStatus.DRAFT);

    const mixed = await listEvents({ createdBy: organizerId, status: ["PUBLISHED", "CANCELED"] });
    expect(mixed.total).toBe(2);
    const mixedIds = mixed.events.map((e) => e.id).sort();
    expect(mixedIds).toEqual([canceledId, publishedId].sort());
    const canceled = mixed.events.find((e) => e.id === canceledId);
    expect(canceled!.status).toBe(EventStatus.CANCELLED);
  });

  test("filters by category", async () => {
    const organizerId = await createOrganizer("category");
    const categoryA = await createCategory("cat-a");
    const categoryB = await createCategory("cat-b");
    const inA = await createEvent(organizerId, categoryA);
    await createEvent(organizerId, categoryB);

    const result = await listEvents({ createdBy: organizerId, categoryId: categoryA });

    expect(result.total).toBe(1);
    expect(result.events[0].id).toBe(inA);
  });

  test("filters by start-time date range", async () => {
    const organizerId = await createOrganizer("dates");
    const categoryId = await createCategory("dates");
    await createEvent(organizerId, categoryId, {
      startTime: new Date("2026-06-01T10:00:00.000Z"),
      endTime: new Date("2026-06-01T18:00:00.000Z"),
    });
    const augustId = await createEvent(organizerId, categoryId, {
      startTime: new Date("2026-08-15T10:00:00.000Z"),
      endTime: new Date("2026-08-15T18:00:00.000Z"),
    });

    const result = await listEvents({
      createdBy: organizerId,
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-09-01T00:00:00.000Z"),
    });

    expect(result.total).toBe(1);
    expect(result.events[0].id).toBe(augustId);
  });

  test("filters by tag overlap", async () => {
    const organizerId = await createOrganizer("tags");
    const categoryId = await createCategory("tags");
    const bunEventId = await createEvent(organizerId, categoryId, { tags: ["typescript", "bun"] });
    await createEvent(organizerId, categoryId, { tags: ["python"] });

    const result = await listEvents({ createdBy: organizerId, tags: ["bun"] });

    expect(result.total).toBe(1);
    expect(result.events[0].id).toBe(bunEventId);
  });
});

describe("getEventDetail — the service core behind GET /api/v1/events/[id]", () => {
  test("returns the event with its category and no registration anonymously", async () => {
    const organizerId = await createOrganizer("detail");
    const categoryId = await createCategory("detail");
    const eventId = await createEvent(organizerId, categoryId, { status: "PUBLISHED" });

    const detail = await getEventDetail(eventId);

    expect(detail).not.toBeNull();
    expect(detail!.event.id).toBe(eventId);
    expect(detail!.category).not.toBeNull();
    expect(detail!.category!.id).toBe(categoryId);
    expect(detail!.isRegistered).toBe(false);
    expect(detail!.registration).toBeUndefined();
  });

  test("reflects the viewer's active registration", async () => {
    const organizerId = await createOrganizer("registered");
    const viewerId = await createOrganizer("viewer");
    const categoryId = await createCategory("registered");
    const eventId = await createEvent(organizerId, categoryId);
    await createRegistration(viewerId, eventId, "CONFIRMED");

    const detail = await getEventDetail(eventId, viewerId);

    expect(detail!.isRegistered).toBe(true);
    expect(detail!.registration).toBeDefined();
    expect(detail!.registration!.userId).toBe(viewerId);
    expect(detail!.registration!.eventId).toBe(eventId);
    expect(detail!.registration!.status).toBe(RegistrationStatus.CONFIRMED);
  });

  test("ignores canceled registrations", async () => {
    const organizerId = await createOrganizer("canceled-reg");
    const viewerId = await createOrganizer("canceled-viewer");
    const categoryId = await createCategory("canceled-reg");
    const eventId = await createEvent(organizerId, categoryId);
    await createRegistration(viewerId, eventId, "CANCELED");

    const detail = await getEventDetail(eventId, viewerId);

    expect(detail!.isRegistered).toBe(false);
    expect(detail!.registration).toBeUndefined();
  });

  test("includes organizer events and similar events, excluding itself", async () => {
    const organizerId = await createOrganizer("related");
    const otherOrganizerId = await createOrganizer("other-organizer");
    const categoryId = await createCategory("related");
    const eventId = await createEvent(organizerId, categoryId);
    const siblingId = await createEvent(organizerId, categoryId);
    const sameCategoryOtherOrganizer = await createEvent(otherOrganizerId, categoryId);

    const detail = await getEventDetail(eventId);

    const organizerIds = detail!.organizerEvents.map((e) => e.id);
    expect(organizerIds).toContain(siblingId);
    expect(organizerIds).not.toContain(eventId);

    const similarIds = detail!.similarEvents.map((e) => e.id);
    expect(similarIds).toContain(sameCategoryOtherOrganizer);
    expect(similarIds).not.toContain(eventId);
  });

  test("returns null for an unknown event id", async () => {
    const detail = await getEventDetail(`missing-${runSuffix}`);
    expect(detail).toBeNull();
  });
});

describe("toUiEvent — DB row to UI shape mapping", () => {
  test("maps enums, capacity, and format-derived flags", () => {
    const row: Parameters<typeof toUiEvent>[0] = {
      id: "evt-mapping",
      title: "Mapping check",
      slug: "mapping-check",
      description: null,
      shortDescription: null,
      categoryId: null as unknown as string,
      type: "NETWORKING",
      format: "HYBRID",
      status: "REGISTRATION_OPEN",
      visibility: "PUBLIC",
      capacity: null,
      registeredCount: 3,
      waitlistCount: 0,
      isVirtual: false,
      isFree: true,
      price: null,
      currency: "USD",
      location: null,
      virtualUrl: null,
      timezone: "UTC",
      startTime: new Date("2026-01-01T10:00:00.000Z"),
      endTime: new Date("2026-01-01T18:00:00.000Z"),
      registrationStart: null,
      registrationEnd: null,
      allowWaitlist: true,
      requiresApproval: false,
      tags: ["test"],
      metadata: null,
      createdBy: "user-mapping",
      createdAt: new Date("2025-12-01T00:00:00.000Z"),
      updatedAt: new Date("2025-12-02T00:00:00.000Z"),
    };

    const mapped = toUiEvent(row);

    // DB types with no UI counterpart fold into "other".
    expect(mapped.eventType).toBe(EventType.OTHER);
    // REGISTRATION_OPEN is an active lifecycle bucket -> "published".
    expect(mapped.status).toBe(EventStatus.PUBLISHED);
    // HYBRID has a physical venue.
    expect(mapped.isInPerson).toBe(true);
    expect(mapped.maxAttendees).toBeUndefined();
    expect(mapped.currentAttendees).toBe(3);
    expect(mapped.description).toBe("");
    expect(mapped.location).toBe("");
  });
});
