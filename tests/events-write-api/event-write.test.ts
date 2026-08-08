/**
 * Integration tests for the event write service core (backlog B3):
 * src/lib/services/event-write/ → POST/PATCH/DELETE /api/v1/events[...]
 *
 * Part of the tests/events-write-api/ split of the former
 * tests/events-write-api.test.ts. Fixtures and FK-order teardown live in
 * ./helpers.ts. Requires DATABASE_URL to point at a reachable Postgres
 * instance.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventRegistration } from "@/db/schema";
import {
  createEvent,
  createEventSchema,
  deleteEvent,
  updateEvent,
  EventWriteError,
} from "@/lib/services/event-write";
import { createRegistration } from "@/lib/services/registration.service";
import {
  baseEventInput,
  cleanupTrackedRows,
  createCategory,
  createUser,
  problemStatus,
  runSuffix,
  seedEvent,
  trackRegistration,
} from "./helpers";

afterEach(cleanupTrackedRows);

describe("createEvent — the service core behind POST /api/v1/events", () => {
  test("creates a free published event with a slug derived from the title", async () => {
    const organizerId = await createUser("organizer");
    const category = await createCategory("create");

    const dto = await seedEvent(organizerId, category.name, {
      title: `B3 Slug Source ${runSuffix}`,
    });

    expect(dto.title).toBe(`B3 Slug Source ${runSuffix}`);
    expect(dto.slug).toBe(`b3-slug-source-${runSuffix}`.toLowerCase());
    expect(dto.status).toBe("PUBLISHED");
    expect(dto.price).toBeNull();
    expect(dto.createdBy).toBe(organizerId);
    expect(typeof dto.startTime).toBe("string");
    expect(new Date(dto.startTime).toISOString()).toBe("2027-06-01T10:00:00.000Z");
  });

  test("derives -2 suffixed slugs on title collision", async () => {
    const organizerId = await createUser("organizer");
    const category = await createCategory("create");
    const title = `B3 Duplicate Title ${runSuffix}`;

    const first = await seedEvent(organizerId, category.name, { title });
    const second = await seedEvent(organizerId, category.name, { title });

    expect(first.slug).toBe(`b3-duplicate-title-${runSuffix}`.toLowerCase());
    expect(second.slug).toBe(`${first.slug}-2`);
  });

  test("rejects an explicit slug that is already taken with 409", async () => {
    const organizerId = await createUser("organizer");
    const category = await createCategory("create");
    const slug = `b3-explicit-${runSuffix}`;

    await seedEvent(organizerId, category.name, { title: `First ${runSuffix}`, slug });

    const error = await createEvent(
      baseEventInput(category.name, { title: `Second ${runSuffix}`, slug }),
      organizerId,
    ).catch((err) => err);
    expect(error).toBeInstanceOf(EventWriteError);
    expect(problemStatus(error)).toBe(409);
  });

  test("rejects unknown categories with 422", async () => {
    const organizerId = await createUser("organizer");
    const error = await createEvent(
      baseEventInput(`no-such-category-${runSuffix}`),
      organizerId,
    ).catch((err) => err);
    expect(error).toBeInstanceOf(EventWriteError);
    expect(problemStatus(error)).toBe(422);
  });

  test("createEventSchema rejects endTime before startTime", () => {
    const parsed = createEventSchema.safeParse(
      baseEventInput(`b3-schema-${runSuffix}`, {
        startTime: new Date("2027-06-01T18:00:00.000Z"),
        endTime: new Date("2027-06-01T10:00:00.000Z"),
      }),
    );
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const paths = parsed.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("endTime");
    }
  });
});

describe("updateEvent — the service core behind PATCH /api/v1/events/[id]", () => {
  test("applies a partial patch and keeps the slug stable", async () => {
    const organizerId = await createUser("organizer");
    const category = await createCategory("update");
    const dto = await seedEvent(organizerId, category.name);

    const updated = await updateEvent(dto.id, {
      title: `B3 Updated Title ${runSuffix}`,
      status: "REGISTRATION_OPEN",
    });

    expect(updated.title).toBe(`B3 Updated Title ${runSuffix}`);
    expect(updated.status).toBe("REGISTRATION_OPEN");
    expect(updated.slug).toBe(dto.slug);
  });

  test("rejects a patch that crosses the stored startTime with 422", async () => {
    const organizerId = await createUser("organizer");
    const category = await createCategory("update");
    const dto = await seedEvent(organizerId, category.name);

    const error = await updateEvent(dto.id, {
      endTime: new Date("2027-06-01T09:00:00.000Z"), // before stored startTime (10:00)
    }).catch((err) => err);
    expect(error).toBeInstanceOf(EventWriteError);
    expect(problemStatus(error)).toBe(422);
  });

  test("rejects turning isFree off without a price with 422", async () => {
    const organizerId = await createUser("organizer");
    const category = await createCategory("update");
    const dto = await seedEvent(organizerId, category.name);

    const error = await updateEvent(dto.id, { isFree: false }).catch((err) => err);
    expect(error).toBeInstanceOf(EventWriteError);
    expect(problemStatus(error)).toBe(422);
  });

  test("accepts a paid conversion with a price", async () => {
    const organizerId = await createUser("organizer");
    const category = await createCategory("update");
    const dto = await seedEvent(organizerId, category.name);

    const updated = await updateEvent(dto.id, { isFree: false, price: 49.5 });
    expect(updated.isFree).toBe(false);
    expect(updated.price).toBe("49.50");
  });

  test("returns 404 for an unknown event", async () => {
    const error = await updateEvent(`00000000-0000-0000-0000-${"0".repeat(12)}`, {
      title: `Nothing ${runSuffix}`,
    }).catch((err) => err);
    expect(error).toBeInstanceOf(EventWriteError);
    expect(problemStatus(error)).toBe(404);
  });
});

describe("deleteEvent — the service core behind DELETE /api/v1/events/[id]", () => {
  test("deletes the event and cascades registrations", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("delete");
    const dto = await seedEvent(organizerId, category.name);

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);

    const result = await deleteEvent(dto.id);
    expect(result).toEqual({ id: dto.id, deleted: true });

    const [gone] = await db.select({ id: event.id }).from(event).where(eq(event.id, dto.id));
    expect(gone).toBeUndefined();

    const [regGone] = await db
      .select({ id: eventRegistration.id })
      .from(eventRegistration)
      .where(eq(eventRegistration.id, registration.id));
    expect(regGone).toBeUndefined();
  });

  test("returns 404 for an unknown event", async () => {
    const error = await deleteEvent(`00000000-0000-0000-0000-${"0".repeat(12)}`).catch(
      (err) => err,
    );
    expect(error).toBeInstanceOf(EventWriteError);
    expect(problemStatus(error)).toBe(404);
  });
});
