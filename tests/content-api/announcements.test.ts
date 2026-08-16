/**
 * Content API (B4) — announcements round-trips: announcement-specific
 * fields (audience targeting, expiry, urgency, acknowledgment) and updates.
 * Part of the split content suite in tests/content-api/.
 */

import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { updateContentItem } from "@/lib/services/content";
import { createContentApiFixtures } from "./helpers";

const { uniqueSuffix, trackCreate, setup, cleanupRows, teardown, actor } =
  createContentApiFixtures();

let actorId = "";

beforeAll(async () => {
  actorId = await setup();
});

afterEach(cleanupRows);

afterAll(teardown);

describe("announcements round-trip", () => {
  test("create an announcement with announcement-specific fields", async () => {
    const suffix = uniqueSuffix();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const announcement = await trackCreate("announcements", {
      title: `Maintenance Notice ${suffix}`,
      excerpt: "Scheduled maintenance window",
      content: "The platform will be unavailable during the maintenance window.",
      type: "maintenance",
      status: "published",
      targetAudience: "specific_chapters",
      targetChapters: ["chapter_north"],
      expiresAt,
      isUrgent: true,
      isPinned: true,
      requiresAcknowledgment: true,
      sendEmailNotification: true,
      displayInDashboard: true,
      authorId: actorId,
    });

    expect(announcement.type).toBe("maintenance");
    expect(announcement.targetAudience).toBe("specific_chapters");
    expect(announcement.targetChapters).toEqual(["chapter_north"]);
    expect(announcement.expiresAt).toBeTruthy();
    expect(announcement.isUrgent).toBe(true);
    expect(announcement.isPinned).toBe(true);
    expect(announcement.requiresAcknowledgment).toBe(true);
    expect(announcement.sendEmailNotification).toBe(true);
    expect(announcement.displayInDashboard).toBe(true);
    expect(announcement.acknowledgmentCount).toBe(0);

    const updated = await updateContentItem(
      "announcements",
      announcement.id as string,
      { isUrgent: false, acknowledgmentCount: 5 },
      actor,
    );
    expect(updated.isUrgent).toBe(false);
    expect(updated.acknowledgmentCount).toBe(5);
  });
});
