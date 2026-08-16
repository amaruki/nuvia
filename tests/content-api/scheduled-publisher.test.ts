/**
 * Issue #17 regression guards — the scheduled-content publisher.
 *
 * Before this fix, SCHEDULED was a permanent dead state: nothing promoted
 * due rows, so scheduled content was invisible forever. These integration
 * tests exercise sweepScheduledContent() (the service behind both the cron
 * script and POST /api/v1/content/sweep) end to end against the DB, plus
 * the write-path rule that a scheduled write must carry a future publish
 * time.
 */

import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";

import { getContentItem, sweepScheduledContent, updateContentItem } from "@/lib/services/content";
import { createContentApiFixtures } from "./helpers";

const {
  uniqueSuffix,
  expectApiError,
  trackCreate,
  makeCategory,
  setup,
  cleanupRows,
  teardown,
  actor,
} = createContentApiFixtures();

beforeAll(async () => {
  await setup();
});

afterEach(cleanupRows);
afterAll(teardown);

/** One hour past or in the future, stable within a test. */
function futureDate(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

describe("scheduled-content publisher (issue #17)", () => {
  test("sweep promotes a due scheduled article to published", async () => {
    const suffix = uniqueSuffix();
    const category = await makeCategory(suffix, "article");
    const publishAt = futureDate(2);

    const article = await trackCreate("articles", {
      title: `Scheduled Sweep Article ${suffix}`,
      excerpt: "An article waiting for its publish moment",
      content: "Scheduled content that the sweeper must promote on time.",
      type: "tutorial",
      category: category.name,
      status: "scheduled",
      scheduledFor: publishAt.toISOString(),
    });

    // Before the publish moment the sweep must leave the row alone.
    const early = await sweepScheduledContent(futureDate(1));
    expect(early.published.some((row) => row.id === article.id)).toBe(false);

    // At/after the publish moment the sweep promotes it.
    const sweep = await sweepScheduledContent(futureDate(3));
    expect(sweep.published.some((row) => row.id === article.id)).toBe(true);

    const promoted = await getContentItem("articles", article.id as string);
    expect(promoted.status).toBe("published");
    // The approval record comes from the system sweeper, not a human.
    // rowToItem spreads metadata.ui to the top level of the payload.
    expect(promoted.reviewedBy).toBe("system:scheduled-content-sweeper");
    expect(typeof promoted.reviewedAt).toBe("string");
  });

  test("sweep is idempotent — a second run does not re-publish", async () => {
    const suffix = uniqueSuffix();
    const category = await makeCategory(suffix, "article");
    const publishAt = futureDate(2);

    const article = await trackCreate("articles", {
      title: `Idempotent Sweep Article ${suffix}`,
      excerpt: "An article that must only publish once",
      content: "Running the sweep twice must not double-publish this row.",
      type: "tutorial",
      category: category.name,
      status: "scheduled",
      scheduledFor: publishAt.toISOString(),
    });

    const now = futureDate(3);
    const first = await sweepScheduledContent(now);
    expect(first.published.some((row) => row.id === article.id)).toBe(true);

    const second = await sweepScheduledContent(now);
    expect(second.published.some((row) => row.id === article.id)).toBe(false);
  });

  test("sweep leaves future-dated scheduled rows pending", async () => {
    const suffix = uniqueSuffix();
    const category = await makeCategory(suffix, "article");

    const article = await trackCreate("articles", {
      title: `Still Pending Article ${suffix}`,
      excerpt: "An article whose time has not come yet",
      content: "The sweeper must not touch this row before its moment.",
      type: "tutorial",
      category: category.name,
      status: "scheduled",
      scheduledFor: futureDate(48).toISOString(),
    });

    const sweep = await sweepScheduledContent();
    expect(sweep.published.some((row) => row.id === article.id)).toBe(false);
    expect(sweep.pending).toBeGreaterThanOrEqual(1);
  });

  test("creating scheduled content without a publish time is rejected", async () => {
    const suffix = uniqueSuffix();
    const category = await makeCategory(suffix, "article");

    await expectApiError(
      () =>
        trackCreate("articles", {
          title: `Missing Time Article ${suffix}`,
          excerpt: "Scheduling without saying when",
          content: "The write path must refuse to create invisible content.",
          type: "tutorial",
          category: category.name,
          status: "scheduled",
        }),
      400,
      "bad-request",
    );
  });

  test("creating scheduled content with a past publish time is rejected", async () => {
    const suffix = uniqueSuffix();
    const category = await makeCategory(suffix, "article");

    await expectApiError(
      () =>
        trackCreate("articles", {
          title: `Past Time Article ${suffix}`,
          excerpt: "Scheduling into the past makes no sense",
          content: "A past time means publish now; the API says so clearly.",
          type: "tutorial",
          category: category.name,
          status: "scheduled",
          scheduledFor: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        }),
      400,
      "bad-request",
    );
  });

  test("patching a draft to scheduled without a time is rejected", async () => {
    const suffix = uniqueSuffix();
    const category = await makeCategory(suffix, "article");

    const draft = await trackCreate("articles", {
      title: `Draft To Schedule ${suffix}`,
      excerpt: "A draft an editor tries to schedule without a date",
      content: "The PATCH path enforces the same rule as create.",
      type: "tutorial",
      category: category.name,
      status: "draft",
    });

    await expectApiError(
      () => updateContentItem("articles", draft.id as string, { status: "scheduled" }, actor),
      400,
      "bad-request",
    );
  });
});
