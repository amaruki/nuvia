/**
 * Integration tests for getEventDetail — the service core behind
 * GET /api/v1/events/[id] (backlog B2).
 *
 * Part of the tests/events-read-api/ split of the former
 * tests/events-read-api.test.ts. Fixtures and FK-order teardown live in
 * ./helpers.ts; this file re-creates its own state via the factory and
 * removes every seeded row after each test. Requires DATABASE_URL to point
 * at a reachable Postgres instance.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { getEventDetail } from "@/lib/services/event-read.service";
import { RegistrationStatus } from "@/types/event";
import { createEventsReadFixtures } from "./helpers";

const { runSuffix, createOrganizer, createCategory, createEvent, createRegistration, cleanup } =
  createEventsReadFixtures();

afterEach(cleanup);

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
