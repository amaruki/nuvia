/**
 * Content API (B4) — articles round-trips: full CRUD, cross-collection
 * isolation, slug collision handling (explicit conflicts, derived retries),
 * and list pagination metadata.
 * Part of the split content suite in tests/content-api/.
 */

import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import {
  deleteContentItem,
  getContentItem,
  listContent,
  updateContentItem,
} from "@/lib/services/content";
import { createContentApiFixtures } from "./helpers";

const { uniqueSuffix, expectApiError, trackCreate, makeCategory, setup, cleanupRows, teardown } =
  createContentApiFixtures();

let actorId = "";

beforeAll(async () => {
  actorId = await setup();
});

afterEach(cleanupRows);

afterAll(teardown);

describe("articles round-trip", () => {
  test("create, read, update, list, and delete an article", async () => {
    const suffix = uniqueSuffix();
    const category = await makeCategory(suffix, "article");

    const article = await trackCreate("articles", {
      title: `Test Article ${suffix}`,
      excerpt: "An excerpt for the test article",
      content: "The body of the test article with enough words to count properly.",
      type: "tutorial",
      category: category.name,
      status: "draft",
      visibility: "members_only",
      tagIds: ["testing", "content"],
      authorId: actorId,
    });

    expect(article.id).toBeTruthy();
    expect(article.title).toBe(`Test Article ${suffix}`);
    expect(article.status).toBe("draft");
    // UI-only visibility survives the DB mapping via metadata.ui.
    expect(article.visibility).toBe("members_only");
    expect(article.type).toBe("tutorial");
    expect(article.category).toBe(category.name);
    expect((article.author as { id: string }).id).toBe(actorId);
    expect(article.tags).toHaveLength(2);
    expect((article.wordCount as number) ?? 0).toBeGreaterThan(0);
    expect((article.readTime as number) ?? 0).toBeGreaterThanOrEqual(1);

    const fetched = await getContentItem("articles", article.id as string);
    expect(fetched.title).toBe(`Test Article ${suffix}`);
    expect(fetched.visibility).toBe("members_only");

    const updated = await updateContentItem(
      "articles",
      article.id as string,
      { title: `Renamed Article ${suffix}`, status: "published", excerpt: "Updated excerpt" },
      actorId,
    );
    expect(updated.title).toBe(`Renamed Article ${suffix}`);
    expect(updated.status).toBe("published");
    expect(updated.publishedAt).toBeTruthy();

    const listed = await listContent("articles", {
      page: 1,
      limit: 10,
      search: `Renamed Article ${suffix}`,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    expect(listed.items.some((item) => item.id === article.id)).toBe(true);

    await deleteContentItem("articles", article.id as string);
    await expectApiError(() => getContentItem("articles", article.id as string), 404, "not-found");
  });

  test("articles are isolated from other collections", async () => {
    const suffix = uniqueSuffix();
    const article = await trackCreate("articles", {
      title: `Isolation Article ${suffix}`,
      content: "Body",
    });
    const publication = await trackCreate("publications", {
      title: `Isolation Publication ${suffix}`,
      content: "Body",
    });

    const publications = await listContent("publications", {
      page: 1,
      limit: 100,
      search: suffix,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    const ids = publications.items.map((item) => item.id);
    expect(ids).toContain(publication.id);
    expect(ids).not.toContain(article.id);

    // Cross-collection lookups miss: the item exists but under another type.
    await expectApiError(
      () => getContentItem("publications", article.id as string),
      404,
      "not-found",
    );
  });

  test("explicit slug collisions surface a conflict, derived slugs retry", async () => {
    const suffix = uniqueSuffix();
    const slug = `explicit-content-slug-${suffix}`;

    await trackCreate("articles", {
      title: `Slug First ${suffix}`,
      content: "Body",
      slug,
    });
    await expectApiError(
      () => trackCreate("articles", { title: `Slug Second ${suffix}`, content: "Body", slug }),
      409,
      "conflict",
    );

    // Same title without an explicit slug: the second insert derives a
    // suffixed slug instead of failing.
    const first = await trackCreate("articles", {
      title: `Derived Slug ${suffix}`,
      content: "Body",
    });
    const second = await trackCreate("articles", {
      title: `Derived Slug ${suffix}`,
      content: "Body",
    });
    expect(first.slug).not.toBe(second.slug);
  });

  test("list pagination returns page metadata", async () => {
    const suffix = uniqueSuffix();
    const batch = `Page-${suffix}`;
    for (let index = 0; index < 3; index += 1) {
      await trackCreate("articles", {
        title: `${batch} Item ${index}`,
        content: "Body",
      });
    }

    const page = await listContent("articles", {
      page: 1,
      limit: 2,
      search: batch,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    expect(page.items.length).toBeLessThanOrEqual(2);
    expect(page.total).toBeGreaterThanOrEqual(3);
    expect(page.totalPages).toBeGreaterThanOrEqual(2);
  });
});
