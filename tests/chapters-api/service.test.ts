/**
 * D1 — Chapters: service layer exercised directly (no HTTP).
 * Part of the split chapters suite in tests/chapters-api/.
 */

import { afterAll, describe, expect, test } from "bun:test";
import {
  createChapter as createChapterDirect,
  deleteChapter as deleteChapterDirect,
  getChapter as getChapterDirect,
  updateChapter as updateChapterDirect,
} from "@/lib/services/chapter.service";
import { createFixtures } from "./helpers";

const { RUN_ID, chapterIds, cleanup } = createFixtures();

afterAll(cleanup);

describe("chapter service layer", () => {
  test("create/get/update/delete round-trip", async () => {
    const created = await createChapterDirect(
      {
        name: `d1-chapter-svc-${RUN_ID}`,
        displayName: `D1 Service Chapter ${RUN_ID}`,
        status: "pending",
        parentChapterId: undefined,
        location: {
          address: "9 Service Lane",
          city: "Unitville",
          state: "Testland",
          country: "Testonia",
          postalCode: "54321",
          timezone: "UTC",
          region: `D1 Region ${RUN_ID}`,
        },
        contactInfo: { email: `svc-${RUN_ID}@example.test`, address: "9 Service Lane" },
        socialMedia: {},
        settings: {
          allowOnlineRegistration: false,
          requireApproval: false,
          membershipDues: 0,
          meetingFrequency: "weekly",
          autoRenewMembership: false,
          sendReminders: false,
          publicDirectory: false,
        },
        memberCount: 7,
        establishedDate: new Date("2020-01-15T00:00:00Z"),
      },
      "system:d1-test",
    );
    chapterIds.push(created.id);

    expect(created.memberCount).toBe(7);
    expect(created.establishedDate.toISOString()).toContain("2020-01-15");
    expect(created.createdBy).toBe("system:d1-test");

    const fetched = await getChapterDirect(created.id);
    expect(fetched?.name).toBe(created.name);

    const updated = await updateChapterDirect(created.id, { memberCount: 12 }, "system:d1-test");
    expect(updated.memberCount).toBe(12);

    expect(await deleteChapterDirect(created.id)).toBe(true);
    expect(await deleteChapterDirect(created.id)).toBe(false);
    expect(await getChapterDirect(created.id)).toBeNull();
  });

  test("unknown ids surface as null/false, not throws", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(await getChapterDirect(missing)).toBeNull();
    expect(await deleteChapterDirect(missing)).toBe(false);
  });
});
