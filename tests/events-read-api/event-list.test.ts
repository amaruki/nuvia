/**
 * Integration tests for listEvents — the service core behind
 * GET /api/v1/events (backlog B2).
 *
 * Part of the tests/events-read-api/ split of the former
 * tests/events-read-api.test.ts. Fixtures and FK-order teardown live in
 * ./helpers.ts; this file re-creates its own state via the factory and
 * removes every seeded row after each test. Requires DATABASE_URL to point
 * at a reachable Postgres instance.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { listEvents } from "@/lib/services/event-read.service";
import { EventStatus, EventType } from "@/types/event";
import { createEventsReadFixtures } from "./helpers";

const { searchToken, createOrganizer, createCategory, createEvent, cleanup } =
  createEventsReadFixtures();

afterEach(cleanup);

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
