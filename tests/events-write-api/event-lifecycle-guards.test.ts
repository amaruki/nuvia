/**
 * Integration tests for the event lifecycle guards (issue #29, findings
 * 1, 5, 6): updateEvent transition allow-list, capacity floor,
 * registration endTime backstop, and the admin check-in event-state guard.
 *
 * Requires DATABASE_URL to point at a reachable Postgres instance.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { event } from "@/db/schema";
import { updateEvent, EventWriteError } from "@/lib/services/event-write";
import {
  checkInRegistration,
  createRegistration,
  RegistrationServiceError,
} from "@/lib/services/registration.service";
import {
  cleanupTrackedRows,
  createCategory,
  createUser,
  inWindowTimes,
  problemStatus,
  seedEvent,
  trackRegistration,
} from "./helpers";

afterEach(cleanupTrackedRows);

describe("updateEvent lifecycle guards (issue #29)", () => {
  test("rejects resurrecting a COMPLETED event with 409", async () => {
    const organizerId = await createUser("organizer");
    const category = await createCategory("lifecycle");
    const dto = await seedEvent(organizerId, category.name, { status: "COMPLETED" });

    const error = await updateEvent(dto.id, { status: "PUBLISHED" }).catch((err) => err);
    expect(error).toBeInstanceOf(EventWriteError);
    expect(problemStatus(error)).toBe(409);
  });

  test("rejects reopening a CANCELED event with 409", async () => {
    const organizerId = await createUser("organizer");
    const category = await createCategory("lifecycle");
    const dto = await seedEvent(organizerId, category.name, { status: "CANCELED" });

    const error = await updateEvent(dto.id, { status: "REGISTRATION_OPEN" }).catch((err) => err);
    expect(error).toBeInstanceOf(EventWriteError);
    expect(problemStatus(error)).toBe(409);
  });

  test("allows a legal transition and a same-status no-op PATCH", async () => {
    const organizerId = await createUser("organizer");
    const category = await createCategory("lifecycle");
    const dto = await seedEvent(organizerId, category.name); // PUBLISHED

    const opened = await updateEvent(dto.id, { status: "REGISTRATION_OPEN" });
    expect(opened.status).toBe("REGISTRATION_OPEN");

    // Forms resend the full payload; same status must stay a no-op.
    const noop = await updateEvent(dto.id, { status: "REGISTRATION_OPEN" });
    expect(noop.status).toBe("REGISTRATION_OPEN");
  });

  test("rejects capacity below the confirmed registration count with 422", async () => {
    const organizerId = await createUser("organizer");
    const firstId = await createUser("attendee");
    const secondId = await createUser("attendee");
    const category = await createCategory("capacity");
    const dto = await seedEvent(organizerId, category.name, { capacity: 10 });

    const { registration: first } = await createRegistration(dto.id, firstId);
    const { registration: second } = await createRegistration(dto.id, secondId);
    [first.id, second.id].forEach(trackRegistration);

    const error = await updateEvent(dto.id, { capacity: 1 }).catch((err) => err);
    expect(error).toBeInstanceOf(EventWriteError);
    expect(problemStatus(error)).toBe(422);

    // Capacity at exactly the registration count stays legal.
    const lowered = await updateEvent(dto.id, { capacity: 2 });
    expect(lowered.capacity).toBe(2);
  });
});

describe("registration endTime backstop (issue #29, finding 5)", () => {
  test("rejects registering for a PUBLISHED event that has already ended", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("backstop");
    // Status stays registerable (PUBLISHED); only the schedule says no.
    const now = Date.now();
    const dto = await seedEvent(organizerId, category.name, {
      startTime: new Date(now - 3 * 60 * 60 * 1000),
      endTime: new Date(now - 2 * 60 * 60 * 1000),
    });

    const error = await createRegistration(dto.id, attendeeId).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(400);
  });
});

describe("admin check-in event-state guard (issue #29, finding 1)", () => {
  test("rejects check-in on a canceled event with 400", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("checkin-guard");
    const dto = await seedEvent(organizerId, category.name, inWindowTimes());

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);
    await updateEvent(dto.id, { status: "CANCELED" });

    const error = await checkInRegistration(dto.id, registration.id).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(400);
  });

  test("rejects check-in once the schedule window has closed", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("checkin-guard");
    const dto = await seedEvent(organizerId, category.name, inWindowTimes());

    const { registration } = await createRegistration(dto.id, attendeeId);
    trackRegistration(registration.id);

    // Move the whole event into the past (window closes at endTime + 1h).
    const now = Date.now();
    await db
      .update(event)
      .set({
        startTime: new Date(now - 4 * 60 * 60 * 1000),
        endTime: new Date(now - 3 * 60 * 60 * 1000),
      })
      .where(eq(event.id, dto.id));

    const error = await checkInRegistration(dto.id, registration.id).catch((err) => err);
    expect(error).toBeInstanceOf(RegistrationServiceError);
    expect(problemStatus(error)).toBe(400);
  });
});
