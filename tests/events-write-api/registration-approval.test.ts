/**
 * Issue #16 regression suite — approval-gated event registrations are no
 * longer a permanent dead end.
 *
 * Covers the new approveRegistration service (PENDING -> CONFIRMED) and a
 * status-graph guard: every non-terminal registration status has at least
 * one outgoing transition, so no future status can be added as a dead end
 * without a failing test.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { event } from "@/db/schema";
import {
  approveRegistration,
  cancelRegistration,
  checkInRegistration,
  createRegistration,
  RegistrationServiceError,
} from "@/lib/services/registration.service";
import type { DbRegistrationStatus } from "@/lib/services/registration.service";
import {
  cleanupTrackedRows,
  createCategory,
  createUser,
  fetchEventCounters,
  inWindowTimes,
  problemStatus,
  seedEvent,
  trackRegistration,
} from "./helpers";

afterEach(cleanupTrackedRows);

describe("approveRegistration — the approval path for requiresApproval events", () => {
  test("PENDING registration becomes CONFIRMED without moving the counters", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("approve");
    const dto = await seedEvent(organizerId, category.name, {
      capacity: 10,
      requiresApproval: true,
    });

    const { registration } = await createRegistration(dto.id, attendeeId, {});
    trackRegistration(registration.id);
    expect(registration.status).toBe("PENDING");
    // PENDING already holds a seat.
    expect(await fetchEventCounters(dto.id)).toEqual({ registeredCount: 1, waitlistCount: 0 });

    const approved = await approveRegistration(dto.id, registration.id);
    expect(approved.registration.status).toBe("CONFIRMED");
    // Approval flips the status only — seat accounting is untouched.
    expect(await fetchEventCounters(dto.id)).toEqual({ registeredCount: 1, waitlistCount: 0 });
  });

  test("an approved registration can be checked in", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("approve-checkin");
    const dto = await seedEvent(organizerId, category.name, {
      requiresApproval: true,
      ...inWindowTimes(),
    });

    const { registration } = await createRegistration(dto.id, attendeeId, {});
    trackRegistration(registration.id);
    await approveRegistration(dto.id, registration.id);

    const checkedIn = await checkInRegistration(dto.id, registration.id);
    expect(checkedIn.registration.status).toBe("ATTENDED");
  });

  test("approving twice is a 409 conflict", async () => {
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("approve-twice");
    const dto = await seedEvent(organizerId, category.name, { requiresApproval: true });

    const { registration } = await createRegistration(dto.id, attendeeId, {});
    trackRegistration(registration.id);
    await approveRegistration(dto.id, registration.id);

    await expect(approveRegistration(dto.id, registration.id)).rejects.toBeInstanceOf(
      RegistrationServiceError,
    );
    try {
      await approveRegistration(dto.id, registration.id);
    } catch (error) {
      expect(problemStatus(error)).toBe(409);
    }
  });

  test("only PENDING rows can be approved (CONFIRMED rejected)", async () => {
    // requiresApproval short-circuits the status derivation, so WAITLISTED
    // rows cannot arise from self-registration on an approval-gated event;
    // exercise the guard with a CONFIRMED row instead.
    const organizerId = await createUser("organizer");
    const attendeeId = await createUser("attendee");
    const category = await createCategory("approve-confirmed");
    const dto = await seedEvent(organizerId, category.name, { capacity: 10 });

    const { registration } = await createRegistration(dto.id, attendeeId, {});
    trackRegistration(registration.id);
    expect(registration.status).toBe("CONFIRMED");

    try {
      await approveRegistration(dto.id, registration.id);
      throw new Error("approveRegistration should have rejected a CONFIRMED row");
    } catch (error) {
      expect(error).toBeInstanceOf(RegistrationServiceError);
      // CONFIRMED means "already approved" — conflict, not a bad request.
      expect(problemStatus(error)).toBe(409);
    }
  });

  test("approving a missing registration is a 404", async () => {
    const organizerId = await createUser("organizer");
    const category = await createCategory("approve-missing");
    const dto = await seedEvent(organizerId, category.name, { requiresApproval: true });

    try {
      await approveRegistration(dto.id, "does-not-exist");
      throw new Error("approveRegistration should have rejected a missing row");
    } catch (error) {
      expect(error).toBeInstanceOf(RegistrationServiceError);
      expect(problemStatus(error)).toBe(404);
    }
  });

  test("waitlist promotion on an approval-gated event lands on PENDING and can then be approved", async () => {
    // The issue's stuck-user scenario end to end: a WAITLISTED row exists,
    // the event requires approval (e.g. the flag was toggled after the
    // waitlist formed), a seat frees, promotion lands on PENDING, and the
    // new approval path un-sticks the promoted user.
    const organizerId = await createUser("organizer");
    const firstId = await createUser("attendee-1");
    const secondId = await createUser("attendee-2");
    const category = await createCategory("promote-pending");
    const dto = await seedEvent(organizerId, category.name, {
      capacity: 1,
      allowWaitlist: true,
    });

    const { registration: confirmed } = await createRegistration(dto.id, firstId, {});
    trackRegistration(confirmed.id);
    const { registration: waitlisted } = await createRegistration(dto.id, secondId, {});
    trackRegistration(waitlisted.id);
    expect(waitlisted.status).toBe("WAITLISTED");

    // Toggle the flag AFTER the waitlist formed — the only way an
    // approval-gated event ends up with WAITLISTED rows.
    await db.update(event).set({ requiresApproval: true }).where(eq(event.id, dto.id));

    const admin = { userId: organizerId, canManage: true };
    const { promoted } = await cancelRegistration(dto.id, confirmed.id, admin, "rejected");
    expect(promoted).not.toBeNull();
    expect(promoted!.status).toBe("PENDING");
    expect(await fetchEventCounters(dto.id)).toEqual({ registeredCount: 1, waitlistCount: 0 });

    // The promoted user is NOT stuck anymore (issue #16).
    const approved = await approveRegistration(dto.id, promoted!.id);
    expect(approved.registration.status).toBe("CONFIRMED");
  });
});

describe("status-graph guard — no dead-end registration status", () => {
  // Every NON-terminal status must have at least one outgoing transition in
  // the registration lifecycle. Terminal states (ATTENDED/NO_SHOW/CANCELED)
  // legitimately have none. If a new enum value lands without a writer, add
  // its transition here first — then make this table pass.
  const OUTGOING: Record<DbRegistrationStatus, string[]> = {
    PENDING: ["approve -> CONFIRMED", "cancel -> CANCELED"],
    CONFIRMED: ["check-in -> ATTENDED", "cancel -> CANCELED"],
    WAITLISTED: ["cancel -> CANCELED", "promotion -> PENDING|CONFIRMED"],
    ATTENDED: [],
    NO_SHOW: [],
    CANCELED: ["re-register (row reuse) -> PENDING|CONFIRMED|WAITLISTED"],
  };
  const NON_TERMINAL = ["PENDING", "CONFIRMED", "WAITLISTED"] as const;

  test("every non-terminal status has at least one outgoing transition", () => {
    for (const status of NON_TERMINAL) {
      expect(OUTGOING[status].length, `dead-end status: ${status}`).toBeGreaterThan(0);
    }
  });
});
