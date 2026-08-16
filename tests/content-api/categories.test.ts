/**
 * Content API (B4) — categories round-trips: create/update/read/list,
 * content counts, and delete gating while content references the category.
 * Part of the split content suite in tests/content-api/.
 */

import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import {
  deleteCategoryItem,
  deleteContentItem,
  getCategoryItem,
  listCategories,
  updateCategoryItem,
} from "@/lib/services/content";
import { createContentApiFixtures } from "./helpers";

const {
  createdCategoryIds,
  uniqueSuffix,
  expectApiError,
  trackCreate,
  makeCategory,
  setup,
  cleanupRows,
  teardown,
  actor,
} = createContentApiFixtures();

let actorId = "";

beforeAll(async () => {
  actorId = await setup();
});

afterEach(cleanupRows);

afterAll(teardown);

describe("categories round-trip", () => {
  test("create, update, count content, and delete a category", async () => {
    const suffix = uniqueSuffix();
    const category = await makeCategory(suffix, "publication");

    expect(category.name).toBe(`Content Cat ${suffix}`);
    expect(category.contentCount).toBe(0);
    expect(category.status).toBe("active");
    expect(category.scope).toBe("global");
    expect(category.emoji).toBe("🧪");
    expect(category.allowedRoles).toEqual(["admin"]);

    const updated = await updateCategoryItem(
      category.id as string,
      { status: "archived", emoji: "🎉", order: 5 },
      actorId,
    );
    expect(updated.status).toBe("archived");
    expect(updated.emoji).toBe("🎉");
    expect(updated.order).toBe(5);

    const fetched = await getCategoryItem(category.id as string);
    expect(fetched.name).toBe(`Content Cat ${suffix}`);

    const listed = await listCategories({
      page: 1,
      limit: 100,
      search: `Content Cat ${suffix}`,
    });
    expect(listed.items.some((item) => item.id === category.id)).toBe(true);

    // Content referencing the category increments its count and blocks delete.
    const article = await trackCreate("articles", {
      title: `Categorized ${suffix}`,
      content: "Body",
      category: category.name as string,
    });
    const withContent = await getCategoryItem(category.id as string);
    expect(withContent.contentCount).toBe(1);

    await expectApiError(() => deleteCategoryItem(category.id as string), 409, "conflict");

    await deleteContentItem("articles", article.id as string, actor);
    await deleteCategoryItem(category.id as string);
    createdCategoryIds.splice(createdCategoryIds.indexOf(category.id as string), 1);
    await expectApiError(() => getCategoryItem(category.id as string), 404, "not-found");
  });
});
