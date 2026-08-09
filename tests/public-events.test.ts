/**
 * UI-24 public events gap-closing:
 * - registration-window mapping (item 3)
 * - safe back navigation resolution (item 6)
 * - self check-in window + credential matching + DB flow (item 5)
 * - public list searchParams parsing / query building / page size (items 1+2)
 *
 * The self check-in DB section requires DATABASE_URL to point at a reachable
 * Postgres instance, like the other tests/events-* integration suites.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { eventRegistration } from "@/db/schema";
import { RegistrationServiceError } from "@/lib/services/registration.service";
import {
  getSelfCheckInWindow,
  getSelfCheckInWindowPhase,
  mintSelfCheckInQrCode,
  qrCredentialsMatch,
  SELF_CHECK_IN_CLOSE_MARGIN_MS,
  SELF_CHECK_IN_OPEN_MARGIN_MS,
  selfCheckIn,
} from "@/lib/services/event-self-check-in.service";
import { getRegistrationWindowLabel, getRegistrationWindowState } from "@/lib/utils/event-utils";
import { resolveBackTarget } from "@/lib/utils/navigation";
import { EventStatus } from "@/types/event";
import type { ProblemDetails } from "@/lib/http";
import {
  buildPublicEventsFilterQuery,
  parsePublicEventsSearchParams,
  PUBLIC_EVENTS_PAGE_SIZE,
  publicEventsHref,
} from "@/app/(public)/events/_lib/public-events-query";

import { createEventsReadFixtures } from "./events-read-api/helpers";

// ---------------------------------------------------------------------------
// Item 3 — registration window mapping
// ---------------------------------------------------------------------------

describe("getRegistrationWindowState (UI-24 item 3)", () => {
  const start = new Date("2026-06-01T10:00:00.000Z");
  const deadline = new Date("2026-05-25T00:00:00.000Z");

  test("REGISTRATION_OPEN follows the date rule like other non-terminal statuses", () => {
    expect(
      getRegistrationWindowState("REGISTRATION_OPEN", start, undefined, new Date("2026-05-20")),
    ).toBe("open");
    expect(
      getRegistrationWindowState("REGISTRATION_OPEN", start, undefined, new Date("2026-06-02")),
    ).toBe("closed");
  });

  test("REGISTRATION_CLOSED is closed regardless of dates", () => {
    expect(
      getRegistrationWindowState("REGISTRATION_CLOSED", start, deadline, new Date("2026-05-01")),
    ).toBe("closed");
  });

  test("PUBLISHED follows the registration deadline", () => {
    expect(getRegistrationWindowState("PUBLISHED", start, deadline, new Date("2026-05-20"))).toBe(
      "open",
    );
    expect(getRegistrationWindowState("PUBLISHED", start, deadline, new Date("2026-05-26"))).toBe(
      "closed",
    );
  });

  test("PUBLISHED without a deadline falls back to the event start", () => {
    expect(getRegistrationWindowState("PUBLISHED", start, undefined, new Date("2026-05-30"))).toBe(
      "open",
    );
    expect(getRegistrationWindowState("PUBLISHED", start, undefined, new Date("2026-06-02"))).toBe(
      "closed",
    );
  });

  test("IN_PROGRESS surfaces as live even after the deadline", () => {
    expect(getRegistrationWindowState("IN_PROGRESS", start, deadline, new Date("2026-06-01"))).toBe(
      "live",
    );
  });

  test("terminal and draft statuses are closed", () => {
    for (const status of ["CANCELED", "COMPLETED", "DRAFT"] as const) {
      expect(getRegistrationWindowState(status, start)).toBe("closed");
    }
  });

  test("labels are human-readable and distinct", () => {
    expect(getRegistrationWindowLabel("open")).toBe("Registration open");
    expect(getRegistrationWindowLabel("closed")).toBe("Registration closed");
    expect(getRegistrationWindowLabel("live")).toBe("Event in progress");
  });
});

// ---------------------------------------------------------------------------
// Item 6 — safe back navigation
// ---------------------------------------------------------------------------

describe("resolveBackTarget (UI-24 item 6)", () => {
  const origin = "https://club.example";
  const fallback = "/events";

  test("no in-app history falls back", () => {
    expect(resolveBackTarget({ historyLength: 1, referrer: "", origin }, fallback)).toBe(fallback);
  });

  test("same-origin referrer means back() stays on site", () => {
    expect(
      resolveBackTarget({ historyLength: 2, referrer: `${origin}/events`, origin }, fallback),
    ).toBeNull();
  });

  test("cross-origin referrer falls back", () => {
    expect(
      resolveBackTarget({ historyLength: 2, referrer: "https://evil.example/", origin }, fallback),
    ).toBe(fallback);
  });

  test("unparseable referrer falls back", () => {
    expect(resolveBackTarget({ historyLength: 2, referrer: "not a url", origin }, fallback)).toBe(
      fallback,
    );
  });

  test("short history wins even with a same-origin referrer", () => {
    expect(
      resolveBackTarget({ historyLength: 1, referrer: `${origin}/events`, origin }, fallback),
    ).toBe(fallback);
  });
});

// ---------------------------------------------------------------------------
// Item 5 — self check-in pure helpers
// ---------------------------------------------------------------------------

describe("self check-in window helpers (UI-24 item 5)", () => {
  const startTime = new Date("2026-06-01T10:00:00.000Z");
  const endTime = new Date("2026-06-01T18:00:00.000Z");

  test("window opens one hour before start and closes one hour after end", () => {
    const window = getSelfCheckInWindow(startTime, endTime);
    expect(window.opensAt.getTime()).toBe(startTime.getTime() - SELF_CHECK_IN_OPEN_MARGIN_MS);
    expect(window.closesAt.getTime()).toBe(endTime.getTime() + SELF_CHECK_IN_CLOSE_MARGIN_MS);
  });

  test("phase transitions: upcoming → open → ended", () => {
    const window = getSelfCheckInWindow(startTime, endTime);
    expect(getSelfCheckInWindowPhase(window, new Date("2026-06-01T08:59:00.000Z"))).toBe(
      "upcoming",
    );
    expect(getSelfCheckInWindowPhase(window, window.opensAt)).toBe("open");
    expect(getSelfCheckInWindowPhase(window, new Date("2026-06-01T12:00:00.000Z"))).toBe("open");
    expect(getSelfCheckInWindowPhase(window, window.closesAt)).toBe("open");
    expect(getSelfCheckInWindowPhase(window, new Date("2026-06-01T19:01:00.000Z"))).toBe("ended");
  });

  test("credential comparison is exact", () => {
    expect(qrCredentialsMatch("same-token", "same-token")).toBe(true);
    expect(qrCredentialsMatch("same-token", "other-token")).toBe(false);
    expect(qrCredentialsMatch("short", "much-longer-token")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Items 1+2 — public list searchParams parsing and query building
// ---------------------------------------------------------------------------

describe("parsePublicEventsSearchParams (UI-24 items 1+2)", () => {
  test("defaults: page 1, page-size slice, public lifecycle statuses", () => {
    const parsed = parsePublicEventsSearchParams(new URLSearchParams());
    expect(parsed.page).toBe(1);
    expect(parsed.forceEmpty).toBe(false);
    expect(parsed.filter).toEqual({});
    expect(parsed.listParams.limit).toBe(PUBLIC_EVENTS_PAGE_SIZE);
    expect(PUBLIC_EVENTS_PAGE_SIZE).toBe(12);
    expect(parsed.listParams.visibility).toEqual(["PUBLIC"]);
    expect(parsed.listParams.status).toEqual([
      "PUBLISHED",
      "REGISTRATION_OPEN",
      "REGISTRATION_CLOSED",
      "IN_PROGRESS",
    ]);
    expect(parsed.listParams.page).toBe(1);
  });

  test("page parsing clamps junk and negatives", () => {
    for (const raw of ["abc", "-3", "0"]) {
      expect(parsePublicEventsSearchParams(new URLSearchParams(`page=${raw}`)).page).toBe(1);
    }
    expect(parsePublicEventsSearchParams(new URLSearchParams("page=4")).page).toBe(4);
  });

  test("search and published status map onto DB statuses", () => {
    const parsed = parsePublicEventsSearchParams(new URLSearchParams("q=tech&status=published"));
    expect(parsed.filter).toEqual({ searchQuery: "tech", status: [EventStatus.PUBLISHED] });
    expect(parsed.listParams.search).toBe("tech");
    expect(parsed.listParams.status).toEqual([
      "PUBLISHED",
      "REGISTRATION_OPEN",
      "REGISTRATION_CLOSED",
      "IN_PROGRESS",
    ]);
  });

  test("unknown status values are ignored rather than crashing", () => {
    const parsed = parsePublicEventsSearchParams(new URLSearchParams("status=bogus"));
    expect(parsed.filter.status).toBeUndefined();
    expect(parsed.forceEmpty).toBe(false);
  });

  test("statuses invisible to the public list force an empty result", () => {
    expect(parsePublicEventsSearchParams(new URLSearchParams("status=cancelled")).forceEmpty).toBe(
      true,
    );
    expect(parsePublicEventsSearchParams(new URLSearchParams("status=completed")).forceEmpty).toBe(
      true,
    );
  });

  test("event types map through the shared UI→DB table", () => {
    expect(
      parsePublicEventsSearchParams(new URLSearchParams("type=workshop")).listParams.type,
    ).toEqual(["WORKSHOP"]);
    expect(
      parsePublicEventsSearchParams(new URLSearchParams("type=other")).listParams.type,
    ).toEqual(["NETWORKING", "PANEL_DISCUSSION", "KEYNOTE", "OTHER"]);
  });

  test("date range params pass through to the range query", () => {
    const parsed = parsePublicEventsSearchParams(
      new URLSearchParams("from=2026-06-01&to=2026-06-05"),
    );
    expect(parsed.listParams.startDate).toEqual(new Date("2026-06-01"));
    expect(parsed.listParams.endDate).toEqual(new Date("2026-06-05"));
  });

  test("tags come from repeated params and drop empties", () => {
    const parsed = parsePublicEventsSearchParams(
      new URLSearchParams("tags=ai&tags=&tags=ml&tags=%20"),
    );
    expect(parsed.listParams.tags).toEqual(["ai", "ml"]);
  });

  test("format flags map to virtual flag / in-person formats; both cancel out", () => {
    expect(
      parsePublicEventsSearchParams(new URLSearchParams("virtual=true")).listParams.isVirtual,
    ).toBe(true);
    expect(
      parsePublicEventsSearchParams(new URLSearchParams("inPerson=true")).listParams.format,
    ).toEqual(["IN_PERSON", "HYBRID"]);
    const both = parsePublicEventsSearchParams(new URLSearchParams("virtual=true&inPerson=true"));
    expect(both.listParams.isVirtual).toBeUndefined();
    expect(both.listParams.format).toBeUndefined();
  });
});

describe("buildPublicEventsFilterQuery / publicEventsHref", () => {
  test("empty filter builds no query", () => {
    expect(buildPublicEventsFilterQuery({})).toBe("");
  });

  test("active filters serialize deterministically", () => {
    const query = buildPublicEventsFilterQuery({
      searchQuery: "tech",
      status: [EventStatus.PUBLISHED],
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      tags: ["ai", "ml"],
      isVirtual: true,
    });
    expect(query).toContain("q=tech");
    expect(query).toContain("status=published");
    expect(query).toContain("from=");
    expect(query).toContain("tags=ai");
    expect(query).toContain("tags=ml");
    expect(query).toContain("virtual=true");
    expect(query).not.toContain("inPerson");
  });

  test("page href preserves filters and replaces the page", () => {
    const params = new URLSearchParams("q=tech&status=open&page=5");
    expect(publicEventsHref(params, 2)).toBe("/events?q=tech&status=open&page=2");
    expect(publicEventsHref(new URLSearchParams("q=tech"), 3)).toBe("/events?q=tech&page=3");
  });
});

// ---------------------------------------------------------------------------
// Item 5 — self check-in DB flow
// ---------------------------------------------------------------------------

describe("self check-in DB flow (UI-24 item 5)", () => {
  const fixtures = createEventsReadFixtures();

  afterAll(async () => {
    await fixtures.cleanup();
  });

  /** Unwraps the RFC 9457 problem from a rejected selfCheckIn call. */
  async function catchProblem(promise: Promise<unknown>): Promise<ProblemDetails> {
    try {
      await promise;
    } catch (error) {
      if (error instanceof RegistrationServiceError) return error.problemDetails;
      throw error;
    }
    throw new Error("expected selfCheckIn to reject with a problem");
  }

  const now = Date.now();
  const liveStart = new Date(now - 30 * 60_000);
  const liveEnd = new Date(now + 2 * 3_600_000);

  test("registered member checks in with a lazily minted credential", async () => {
    const organizerId = await fixtures.createOrganizer("sci-org");
    const memberId = await fixtures.createOrganizer("sci-member");
    const categoryId = await fixtures.createCategory("sci");
    const eventId = await fixtures.createEvent(organizerId, categoryId, {
      startTime: liveStart,
      endTime: liveEnd,
    });
    const registrationId = await fixtures.createRegistration(memberId, eventId);

    // Lazy mint: the registration starts without a credential.
    const credential = await mintSelfCheckInQrCode(registrationId);
    expect(credential.length).toBeGreaterThanOrEqual(24);
    // A second call returns the same credential — the owner's badge is stable.
    expect(await mintSelfCheckInQrCode(registrationId)).toBe(credential);

    // Wrong credential is rejected without touching the registration.
    const rejected = await catchProblem(selfCheckIn(eventId, memberId, "not-the-right-credential"));
    expect(rejected.status).toBe(403);
    expect(rejected.type).toContain("invalid-check-in-code");

    // The right credential checks the owner in.
    const checkedIn = await selfCheckIn(eventId, memberId, credential);
    expect(checkedIn.registrationId).toBe(registrationId);
    expect(checkedIn.checkedInAt).toBeDefined();

    const [row] = await db
      .select({ status: eventRegistration.status, checkedInAt: eventRegistration.checkedInAt })
      .from(eventRegistration)
      .where(eq(eventRegistration.id, registrationId));
    expect(row?.status).toBe("ATTENDED");
    expect(row?.checkedInAt).toBeTruthy();

    // A second attempt is an honest conflict, not a silent success.
    const again = await catchProblem(selfCheckIn(eventId, memberId, credential));
    expect(again.status).toBe(409);
    expect(again.detail).toContain("already checked in");
  });

  test("a member without a registration cannot check in", async () => {
    const organizerId = await fixtures.createOrganizer("no-reg-org");
    const strangerId = await fixtures.createOrganizer("no-reg-stranger");
    const categoryId = await fixtures.createCategory("no-reg");
    const eventId = await fixtures.createEvent(organizerId, categoryId, {
      startTime: liveStart,
      endTime: liveEnd,
    });

    const problemDetails = await catchProblem(
      selfCheckIn(eventId, strangerId, "any-credential-value"),
    );
    expect(problemDetails.status).toBe(404);
  });

  test("check-in outside the window is refused", async () => {
    const organizerId = await fixtures.createOrganizer("future-org");
    const memberId = await fixtures.createOrganizer("future-member");
    const categoryId = await fixtures.createCategory("future");
    const eventId = await fixtures.createEvent(organizerId, categoryId, {
      startTime: new Date(now + 3 * 24 * 3_600_000),
      endTime: new Date(now + 3 * 24 * 3_600_000 + 3_600_000),
    });
    const registrationId = await fixtures.createRegistration(memberId, eventId);
    const credential = await mintSelfCheckInQrCode(registrationId);

    const problemDetails = await catchProblem(selfCheckIn(eventId, memberId, credential));
    expect(problemDetails.status).toBe(400);
    expect(problemDetails.detail).toContain("has not opened yet");
  });

  test("cancelled events refuse self check-in", async () => {
    const organizerId = await fixtures.createOrganizer("cancel-org");
    const memberId = await fixtures.createOrganizer("cancel-member");
    const categoryId = await fixtures.createCategory("cancel");
    const eventId = await fixtures.createEvent(organizerId, categoryId, {
      status: "CANCELED",
      startTime: liveStart,
      endTime: liveEnd,
    });
    const registrationId = await fixtures.createRegistration(memberId, eventId);
    const credential = await mintSelfCheckInQrCode(registrationId);

    const problemDetails = await catchProblem(selfCheckIn(eventId, memberId, credential));
    expect(problemDetails.status).toBe(400);
    expect(problemDetails.detail).toContain("canceled");
  });

  test("non-confirmed registrations cannot self check in", async () => {
    const organizerId = await fixtures.createOrganizer("pend-org");
    const memberId = await fixtures.createOrganizer("pend-member");
    const categoryId = await fixtures.createCategory("pend");
    const eventId = await fixtures.createEvent(organizerId, categoryId, {
      startTime: liveStart,
      endTime: liveEnd,
    });
    const registrationId = await fixtures.createRegistration(memberId, eventId, "PENDING");
    const credential = await mintSelfCheckInQrCode(registrationId);

    const problemDetails = await catchProblem(selfCheckIn(eventId, memberId, credential));
    expect(problemDetails.status).toBe(400);
    expect(problemDetails.detail).toContain("Only confirmed registrations");
  });
});
