import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { forumPost } from "@/db/schema";
import {
  createCategory,
  createCategorySchema,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "@/lib/services/forum";
import {
  createActor,
  createTestCategory,
  createTestPost,
  expectForumProblem,
  registerCleanup,
  uniqueSuffix,
} from "./helpers";

registerCleanup();

describe("forum categories", () => {
  test("create, read, list, update", async () => {
    const admin = await createActor("admin");

    const created = await createTestCategory(admin, {
      name: "Watercooler Lounge 42x",
      icon: "MessageSquare",
      color: "#3b82f6",
    });
    expect(created.displayName).toBe("Watercooler Lounge 42x");
    expect(created.name).toBe("watercooler-lounge-42x"); // slug derived from display name
    expect(created.postCount).toBe(0);
    expect(created.lastPostAt).toBeNull();

    const fetched = await getCategory(created.id);
    expect(fetched.id).toBe(created.id);

    const list = await listCategories();
    expect(list.some((entry) => entry.id === created.id)).toBe(true);

    const updated = await updateCategory(
      created.id,
      { name: "Watercooler Lounge Renamed", color: "#ef4444" },
      admin,
    );
    expect(updated.displayName).toBe("Watercooler Lounge Renamed");
    expect(updated.color).toBe("#ef4444");
    // Slug untouched unless explicitly changed.
    expect(updated.name).toBe("watercooler-lounge-42x");
  });

  test("duplicate slug is rejected", async () => {
    const admin = await createActor("admin");
    const suffix = uniqueSuffix();

    await createTestCategory(admin, { slug: `dup-slug-${suffix}` });
    await expectForumProblem(
      createCategory({ name: "Another Category", slug: `dup-slug-${suffix}` }, admin),
      409,
    );
  });

  test("unknown requiredRole is rejected by the schema", () => {
    const parsed = createCategorySchema.safeParse({
      name: "Gated",
      requiredRole: "definitely-not-a-role",
    });
    expect(parsed.success).toBe(false);
  });

  test("delete is blocked while posts exist, succeeds once empty", async () => {
    const admin = await createActor("admin");
    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);

    await expectForumProblem(deleteCategory(category.id, admin), 409);

    // Soft delete still leaves a row behind; only an empty category goes.
    await db.delete(forumPost).where(eq(forumPost.id, post.id));
    await deleteCategory(category.id, admin);
    await expectForumProblem(getCategory(category.id), 404);
  });

  test("missing category is a 404", async () => {
    const admin = await createActor("admin");
    await expectForumProblem(getCategory(`missing-${uniqueSuffix()}`), 404);
    await expectForumProblem(deleteCategory(`missing-${uniqueSuffix()}`, admin), 404);
  });
});
