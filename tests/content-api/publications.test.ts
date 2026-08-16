/**
 * Content API (B4) — publications round-trips: creation with UI round-trip
 * fields (visibility, download, featured, priority, SEO) and updates.
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

describe("publications round-trip", () => {
  test("create and update a publication with UI round-trip fields", async () => {
    const suffix = uniqueSuffix();

    const publication = await trackCreate("publications", {
      title: `Whitepaper ${suffix}`,
      excerpt: "A publication excerpt",
      content: "Publication body text with enough words to measure reading time.",
      type: "whitepaper",
      status: "published",
      visibility: "premium_only",
      downloadEnabled: true,
      isFeatured: true,
      priority: 10,
      seo: { title: `SEO ${suffix}`, description: "SEO description", keywords: ["seo"] },
      authorId: actorId,
    });

    expect(publication.type).toBe("whitepaper");
    expect(publication.status).toBe("published");
    expect(publication.visibility).toBe("premium_only");
    expect(publication.downloadEnabled).toBe(true);
    expect(publication.isFeatured).toBe(true);
    expect(publication.priority).toBe(10);
    expect((publication.seo as { title: string }).title).toBe(`SEO ${suffix}`);
    expect(publication.publishedAt).toBeTruthy();

    const updated = await updateContentItem(
      "publications",
      publication.id as string,
      { status: "archived", downloadEnabled: false },
      actor,
    );
    expect(updated.status).toBe("archived");
    expect(updated.downloadEnabled).toBe(false);
  });
});
