/**
 * Integration tests for the events write path and registration lifecycle
 * (backlog B3).
 *
 * These tests exercise the service cores behind the B3 routes:
 *   - event-write.service.ts  → POST/PATCH/DELETE /api/v1/events[...]
 *   - registration.service.ts → /api/v1/events/[id]/registrations[...]
 *
 * Like the B2 read tests, every row is seeded with a per-run suffix and torn
 * down in FK order (registrations → events → categories → users) after each
 * test. Requires DATABASE_URL to point at a reachable Postgres instance.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventCategory, eventRegistration, user } from "@/db/schema";
import {
  createEvent,
  createEventSchema,
  deleteEvent,
  updateEvent,
  EventWriteError,
  type CreateEventInput,
} from "@/lib/services/event-write.service";
import {
  cancelRegistration,
  checkInRegistration,
  createRegistration,
  listRegistrations,
  RegistrationServiceError,
} from "@/lib/services/registration.service";

const runSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createdUserIds: string[] = [];
const createdCategoryIds: string[] = [];
const createdEventIds: string[] = [];
const createdRegistrationIds: string[] = [];

let userCounter = 0;
let categoryCounter = 0;

function problemStatus(error: unknown): number | undefined {
  if (
    (error instanceof EventWriteError || error instanceof RegistrationServiceError) &&
    typeof error.problemDetails === "object"
  ) {
    return error.problemDetails.status;
  }
  return undefined;
}

async function createUser(label: string): Promise<string> {
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

async function createCategory(label: string): Promise<{ id: string; name: string }> {
  categoryCounter += 1;
  const name = `B3 ${label} ${categoryCounter} ${runSuffix}`;
  const [row] = await db.insert(eventCategory).values({ name }).returning({ id: eventCategory.id });
  createdCategoryIds.push(row.id);
  return { id: row.id, name };
}

function baseEventInput(
  category: string,
  overrides: Partial<CreateEventInput> = {},
): CreateEventInput {
  return {
    title: `B3 Write Test ${runSuffix}`,
    description: "Seeded by tests/events-write-api.test.ts",
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
async function seedEvent(
  organizerId: string,
  category: string,
  overrides: Partial<CreateEventInput> = {},
) {
  const dto = await createEvent(baseEventInput(category, overrides), organizerId);
  createdEventIds.push(dto.id);
  return dto;
}

function trackRegistration(id: string): string {
  createdRegistrationIds.push(id);
  return id;
}

async function fetchEventCounters(eventId: string) {
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

async function fetchRegistrationStatus(registrationId: string) {
  const [row] = await db
    .select({ status: eventRegistration.status })
    .from(eventRegistration)
    .where(eq(eventRegistration.id, registrationId))
    .limit(1);
  return row?.status;
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
});

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
    const dto = await seedEvent(organizerId, category.name);

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

describe("checkInRegistration — the service core behind POST .../registrations/[id]/check-in", () => {
  test("marks a confirmed registration as attended with a timestamp", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("checkin");
    const dto = await seedEvent(organizerId, category.name);

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
    const dto = await seedEvent(organizerId, category.name);

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
    const dto = await seedEvent(organizerId, category.name, { capacity: 1 });

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
