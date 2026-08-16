/**
 * Integration tests for the registration lifecycle service core (backlog B3):
 * registration.service.ts create + cancel paths behind
 * POST /api/v1/events/[id]/registrations and .../registrations/[id]/cancel.
 *
 * Part of the tests/events-write-api/ split of the former
 * tests/events-write-api.test.ts. Fixtures and FK-order teardown live in
 * ./helpers.ts. Requires DATABASE_URL to point at a reachable Postgres
 * instance.
 */
import { afterEach, describe, expect, test } from "bun:test";
import {
  cancelRegistration,
  checkInRegistration,
  createRegistration,
  RegistrationServiceError,
} from "@/lib/services/registration.service";
import {
  cleanupTrackedRows,
  createCategory,
  createUser,
  fetchEventCounters,
  fetchRegistrationMetadata,
  fetchRegistrationStatus,
  inWindowTimes,
  problemStatus,
  runSuffix,
  seedEvent,
  trackRegistration,
} from "./helpers";

afterEach(cleanupTrackedRows);

describe("createRegistration — the service core behind POST /events/[id]/registrations", () => {
  test("confirms a registration with free capacity and bumps the counters", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("register");
    const dto = await seedEvent(organizerId, category.name, { capacity: 10 });

    const { registration, event: eventSnapshot } = await createRegistration(dto.id, attendeeId, {
      notes: `please seat me near the front ${runSuffix}`,
    });
    trackRegistration(registration.id);

    expect(registration.status).toBe("CONFIRMED");
    expect(registration.notes).toBe(`please seat me near the front ${runSuffix}`);
    expect(eventSnapshot.registeredCount).toBe(1);
    expect(eventSnapshot.waitlistCount).toBe(0);

    const counters = await fetchEventCounters(dto.id);
    expect(counters).toEqual({ registeredCount: 1, waitlistCount: 0 });
  });

  test("assigns PENDING when the event requires approval", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("register");
    const dto = await seedEvent(organizerId, category.name, { requiresApproval: true });

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);
    expect(registration.status).toBe("PENDING");
  });

  test("waitlists when the event is full and the waitlist is allowed", async () => {
    const organizerId = await createUser("organizer");
    const firstAttendeeId = await createUser("attendee");
    const secondAttendeeId = await createUser("attendee");
    const category = await createCategory("register");
    const dto = await seedEvent(organizerId, category.name, { capacity: 1 });

    const { registration: confirmed } = await createRegistration(dto.id, firstAttendeeId);
    trackRegistration(confirmed.id);
    expect(confirmed.status).toBe("CONFIRMED");

    const { registration: waitlisted, event: eventSnapshot } = await createRegistration(
      dto.id,
      secondAttendeeId,
    );
    trackRegistration(waitlisted.id);

    expect(waitlisted.status).toBe("WAITLISTED");
    expect(eventSnapshot.registeredCount).toBe(1);
    expect(eventSnapshot.waitlistCount).toBe(1);
  });

  test("rejects with 400 when full and the waitlist is disabled", async () => {
    const organizerId = await createUser("organizer");
    const firstAttendeeId = await createUser("attendee");
    const secondAttendeeId = await createUser("attendee");
    const category = await createCategory("register");
    const dto = await seedEvent(organizerId, category.name, {
      capacity: 1,
      allowWaitlist: false,
    });

    const { registration } = await createRegistration(dto.id, firstAttendeeId);
    trackRegistration(registration.id);

    const error = await createRegistration(dto.id, secondAttendeeId).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(400);
  });

  test("rejects duplicate registrations with 409", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("register");
    const dto = await seedEvent(organizerId, category.name);

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);

    const error = await createRegistration(dto.id, attendeeId).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(409);
  });

  test("revives a canceled registration instead of inserting a new row", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("register");
    const dto = await seedEvent(organizerId, category.name);

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);
    await cancelRegistration(dto.id, registration.id, { userId: attendeeId, canManage: false });

    const { registration: revived } = await createRegistration(dto.id, attendeeId);
    trackRegistration(revived.id);

    expect(revived.id).toBe(registration.id);
    expect(revived.status).toBe("CONFIRMED");
  });

  test("rejects paid events with 501", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("register");
    const dto = await seedEvent(organizerId, category.name, { isFree: false, price: 25 });

    const error = await createRegistration(dto.id, attendeeId).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(501);
  });

  test("rejects events that are not open for registration with 400", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("register");
    const dto = await seedEvent(organizerId, category.name, { status: "DRAFT" });

    const error = await createRegistration(dto.id, attendeeId).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(400);
  });

  test("returns 404 for an unknown event", async () => {
    const attendeeId = await createUser("attendee");
    const error = await createRegistration(
      `00000000-0000-0000-0000-${"0".repeat(12)}`,
      attendeeId,
    ).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(404);
  });
});

describe("cancelRegistration — the service core behind POST .../registrations/[id]/cancel", () => {
  test("lets the owner cancel and decrements the counter", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("cancel");
    const dto = await seedEvent(organizerId, category.name, { capacity: 5 });

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);

    const { registration: canceled, promoted } = await cancelRegistration(dto.id, registration.id, {
      userId: attendeeId,
      canManage: false,
    });

    expect(canceled.status).toBe("CANCELED");
    expect(promoted).toBeNull();
    expect(await fetchEventCounters(dto.id)).toEqual({ registeredCount: 0, waitlistCount: 0 });
    expect(await fetchRegistrationStatus(registration.id)).toBe("CANCELED");
  });

  test("rejects non-owners without events:manage with 403", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const strangerId = await createUser("stranger");
    const category = await createCategory("cancel");
    const dto = await seedEvent(organizerId, category.name);

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);

    const error = await cancelRegistration(dto.id, registration.id, {
      userId: strangerId,
      canManage: false,
    }).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(403);
  });

  test("lets an event manager cancel someone else's registration", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const managerId = await createUser("manager");
    const category = await createCategory("cancel");
    const dto = await seedEvent(organizerId, category.name);

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);

    const { registration: canceled } = await cancelRegistration(dto.id, registration.id, {
      userId: managerId,
      canManage: true,
    });
    expect(canceled.status).toBe("CANCELED");
  });

  test("persists an admin-provided cancellation reason into metadata", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const managerId = await createUser("manager");
    const category = await createCategory("cancel");
    const dto = await seedEvent(organizerId, category.name);

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);

    const { registration: canceled } = await cancelRegistration(
      dto.id,
      registration.id,
      { userId: managerId, canManage: true },
      "Double booking — moved to the afternoon session",
    );

    expect(canceled.status).toBe("CANCELED");
    const metadata = await fetchRegistrationMetadata(registration.id);
    expect(metadata?.cancellationReason).toBe("Double booking — moved to the afternoon session");
  });

  test("leaves metadata untouched when no reason is given", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("cancel");
    const dto = await seedEvent(organizerId, category.name);

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);

    await cancelRegistration(dto.id, registration.id, { userId: attendeeId, canManage: false });

    const metadata = await fetchRegistrationMetadata(registration.id);
    expect(metadata ?? null).toBeNull();
  });

  test("rejects canceling an already canceled registration with 409", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("cancel");
    const dto = await seedEvent(organizerId, category.name);

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);
    await cancelRegistration(dto.id, registration.id, { userId: attendeeId, canManage: false });

    const error = await cancelRegistration(dto.id, registration.id, {
      userId: attendeeId,
      canManage: false,
    }).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(409);
  });

  test("rejects canceling an attended registration with 400", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("cancel");
    const dto = await seedEvent(organizerId, category.name, inWindowTimes());

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);
    await checkInRegistration(dto.id, registration.id);

    const error = await cancelRegistration(dto.id, registration.id, {
      userId: attendeeId,
      canManage: true,
    }).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(400);
  });

  test("promotes the longest-waiting registration into a freed seat", async () => {
    const organizerId = await createUser("organizer");
    const firstAttendeeId = await createUser("attendee");
    const secondAttendeeId = await createUser("attendee");
    const thirdAttendeeId = await createUser("attendee");
    const category = await createCategory("cancel");
    const dto = await seedEvent(organizerId, category.name, { capacity: 1 });

    const { registration: confirmed } = await createRegistration(dto.id, firstAttendeeId);
    const { registration: firstWaitlisted } = await createRegistration(dto.id, secondAttendeeId);
    const { registration: secondWaitlisted } = await createRegistration(dto.id, thirdAttendeeId);
    [confirmed.id, firstWaitlisted.id, secondWaitlisted.id].forEach(trackRegistration);

    const { promoted } = await cancelRegistration(dto.id, confirmed.id, {
      userId: firstAttendeeId,
      canManage: false,
    });

    expect(promoted?.id).toBe(firstWaitlisted.id);
    expect(promoted?.status).toBe("CONFIRMED");
    expect(await fetchRegistrationStatus(secondWaitlisted.id)).toBe("WAITLISTED");
    expect(await fetchEventCounters(dto.id)).toEqual({ registeredCount: 1, waitlistCount: 1 });
  });
});
