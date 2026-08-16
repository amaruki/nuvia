/**
 * Integration tests for the registration no-show service core (issue #17):
 * registration markNoShowRegistration behind POST
 * /api/v1/events/[id]/registrations/[registrationId]/no-show.
 *
 * NO_SHOW was a dead enum value: the dashboard rendered a badge for it and
 * cancel treated it as a recorded outcome, but nothing ever wrote it. The
 * mutation mirrors cancel's seat accounting — a no-show frees the seat the
 * confirmed registrant held and promotes the longest-waiting waitlist row.
 *
 * Fixtures and FK-order teardown live in ./helpers.ts. Requires
 * DATABASE_URL to point at a reachable Postgres instance.
 */
import { afterEach, describe, expect, test } from "bun:test";
import {
  checkInRegistration,
  createRegistration,
  markNoShowRegistration,
  RegistrationServiceError,
} from "@/lib/services/registration.service";
import {
  cleanupTrackedRows,
  createCategory,
  createUser,
  fetchEventCounters,
  fetchRegistrationStatus,
  inWindowTimes,
  problemStatus,
  seedEvent,
  trackRegistration,
} from "./helpers";

afterEach(cleanupTrackedRows);

describe("markNoShowRegistration — the service core behind POST .../registrations/[id]/no-show", () => {
  test("marks a confirmed registration as no-show and releases the seat", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("noshow");
    const dto = await seedEvent(organizerId, category.name, { capacity: 5 });

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);

    const { registration: noShow, promoted } = await markNoShowRegistration(
      dto.id,
      registration.id,
    );

    expect(noShow.status).toBe("NO_SHOW");
    expect(promoted).toBeNull();
    expect(await fetchEventCounters(dto.id)).toEqual({ registeredCount: 0, waitlistCount: 0 });
    expect(await fetchRegistrationStatus(registration.id)).toBe("NO_SHOW");
  });

  test("promotes the longest-waiting registration into the freed seat", async () => {
    const organizerId = await createUser("organizer");
    const firstAttendeeId = await createUser("attendee");
    const secondAttendeeId = await createUser("attendee");
    const thirdAttendeeId = await createUser("attendee");
    const category = await createCategory("noshow");
    const dto = await seedEvent(organizerId, category.name, { capacity: 1 });

    const { registration: confirmed } = await createRegistration(dto.id, firstAttendeeId);
    const { registration: firstWaitlisted } = await createRegistration(dto.id, secondAttendeeId);
    const { registration: secondWaitlisted } = await createRegistration(dto.id, thirdAttendeeId);
    [confirmed.id, firstWaitlisted.id, secondWaitlisted.id].forEach(trackRegistration);

    const { promoted } = await markNoShowRegistration(dto.id, confirmed.id);

    expect(promoted?.id).toBe(firstWaitlisted.id);
    expect(promoted?.status).toBe("CONFIRMED");
    expect(await fetchRegistrationStatus(secondWaitlisted.id)).toBe("WAITLISTED");
    expect(await fetchEventCounters(dto.id)).toEqual({ registeredCount: 1, waitlistCount: 1 });
  });

  test("rejects marking the same registration twice with 409", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("noshow");
    const dto = await seedEvent(organizerId, category.name);

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);
    await markNoShowRegistration(dto.id, registration.id);

    const error = await markNoShowRegistration(dto.id, registration.id).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(409);
  });

  test("rejects a no-show on a pending registration with 400", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("noshow");
    const dto = await seedEvent(organizerId, category.name, { requiresApproval: true });

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);
    expect(registration.status).toBe("PENDING");

    const error = await markNoShowRegistration(dto.id, registration.id).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(400);
  });

  test("rejects a no-show on an attended registration with 400", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("noshow");
    const dto = await seedEvent(organizerId, category.name, inWindowTimes());

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);
    await checkInRegistration(dto.id, registration.id);

    const error = await markNoShowRegistration(dto.id, registration.id).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(400);
  });

  test("returns 404 for an unknown registration", async () => {
    const organizerId = await createUser("organizer");
    const category = await createCategory("noshow");
    const dto = await seedEvent(organizerId, category.name);

    const error = await markNoShowRegistration(
      dto.id,
      `00000000-0000-0000-0000-${"0".repeat(12)}`,
    ).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(404);
  });
});
