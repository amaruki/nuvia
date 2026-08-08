/**
 * Unit tests for toUiEvent — DB row to UI shape mapping (backlog B2).
 *
 * Part of the tests/events-read-api/ split of the former
 * tests/events-read-api.test.ts. Pure mapping logic: no database rows are
 * created, so no fixtures or teardown are needed.
 */
import { describe, expect, test } from "bun:test";
import { toUiEvent } from "@/lib/services/event-read.service";
import { EventStatus, EventType } from "@/types/event";

describe("toUiEvent — DB row to UI shape mapping", () => {
  test("maps enums, capacity, and format-derived flags", () => {
    const row: Parameters<typeof toUiEvent>[0] = {
      id: "evt-mapping",
      title: "Mapping check",
      slug: "mapping-check",
      description: null,
      shortDescription: null,
      categoryId: null as unknown as string,
      type: "NETWORKING",
      format: "HYBRID",
      status: "REGISTRATION_OPEN",
      visibility: "PUBLIC",
      capacity: null,
      registeredCount: 3,
      waitlistCount: 0,
      isVirtual: false,
      isFree: true,
      price: null,
      currency: "USD",
      location: null,
      virtualUrl: null,
      timezone: "UTC",
      startTime: new Date("2026-01-01T10:00:00.000Z"),
      endTime: new Date("2026-01-01T18:00:00.000Z"),
      registrationStart: null,
      registrationEnd: null,
      allowWaitlist: true,
      requiresApproval: false,
      tags: ["test"],
      metadata: null,
      createdBy: "user-mapping",
      createdAt: new Date("2025-12-01T00:00:00.000Z"),
      updatedAt: new Date("2025-12-02T00:00:00.000Z"),
    };

    const mapped = toUiEvent(row);

    // DB types with no UI counterpart fold into "other".
    expect(mapped.eventType).toBe(EventType.OTHER);
    // REGISTRATION_OPEN is an active lifecycle bucket -> "published".
    expect(mapped.status).toBe(EventStatus.PUBLISHED);
    // HYBRID has a physical venue.
    expect(mapped.isInPerson).toBe(true);
    expect(mapped.maxAttendees).toBeUndefined();
    expect(mapped.currentAttendees).toBe(3);
    expect(mapped.description).toBe("");
    expect(mapped.location).toBe("");
  });
});
