/**
 * Integration tests for the registration check-in and listing service cores
 * (backlog B3): registration.service.ts checkInRegistration +
 * listRegistrations behind .../registrations check-in and GET paths.
 *
 * Part of the tests/events-write-api/ split of the former
 * tests/events-write-api.test.ts. Fixtures and FK-order teardown live in
 * ./helpers.ts. Requires DATABASE_URL to point at a reachable Postgres
 * instance.
 */
import { afterEach, describe, expect, test } from "bun:test";
import {
  checkInRegistration,
  createRegistration,
  listRegistrations,
  RegistrationServiceError,
} from "@/lib/services/registration.service";
import {
  cleanupTrackedRows,
  createCategory,
  createUser,
  inWindowTimes,
  problemStatus,
  runSuffix,
  seedEvent,
  trackRegistration,
} from "./helpers";

afterEach(cleanupTrackedRows);

describe("checkInRegistration — the service core behind POST .../registrations/[id]/check-in", () => {
  test("marks a confirmed registration as attended with a timestamp", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("checkin");
    const dto = await seedEvent(organizerId, category.name, inWindowTimes());

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);

    const { registration: checkedIn } = await checkInRegistration(dto.id, registration.id);
    expect(checkedIn.status).toBe("ATTENDED");
    expect(checkedIn.checkedInAt).not.toBeNull();
  });

  test("rejects checking in twice with 409", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("checkin");
    const dto = await seedEvent(organizerId, category.name, inWindowTimes());

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);
    await checkInRegistration(dto.id, registration.id);

    const error = await checkInRegistration(dto.id, registration.id).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(409);
  });

  test("rejects checking in a waitlisted registration with 400", async () => {
    const organizerId = await createUser("organizer");
    const firstAttendeeId = await createUser("attendee");
    const secondAttendeeId = await createUser("attendee");
    const category = await createCategory("checkin");
    const dto = await seedEvent(organizerId, category.name, { capacity: 1, ...inWindowTimes() });

    const { registration: confirmed } = await createRegistration(dto.id, firstAttendeeId);
    const { registration: waitlisted } = await createRegistration(dto.id, secondAttendeeId);
    [confirmed.id, waitlisted.id].forEach(trackRegistration);

    const error = await checkInRegistration(dto.id, waitlisted.id).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(400);
  });
});

describe("listRegistrations — the service core behind GET /events/[id]/registrations", () => {
  test("returns attendee info, honors status filter and search", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("list");
    const dto = await seedEvent(organizerId, category.name, { capacity: 5 });

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);

    const all = await listRegistrations(dto.id, { page: 1, limit: 20 });
    expect(all.total).toBe(1);
    expect(all.registrations[0]?.user?.id).toBe(attendeeId);
    expect(all.registrations[0]?.user?.email).toContain(runSuffix);

    const confirmedOnly = await listRegistrations(dto.id, {
      page: 1,
      limit: 20,
      status: ["CONFIRMED"],
    });
    expect(confirmedOnly.total).toBe(1);

    const attendedOnly = await listRegistrations(dto.id, {
      page: 1,
      limit: 20,
      status: ["ATTENDED"],
    });
    expect(attendedOnly.total).toBe(0);

    const searched = await listRegistrations(dto.id, {
      page: 1,
      limit: 20,
      search: `b3-write-attendee-`,
    });
    expect(searched.total).toBeGreaterThanOrEqual(1);
  });
});
