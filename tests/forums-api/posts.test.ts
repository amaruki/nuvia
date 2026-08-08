import { describe, expect, test } from "bun:test";
import { deletePost, getPost, listPosts, updatePost } from "@/lib/services/forum";
import {
  createActor,
  createTestCategory,
  createTestPost,
  expectForumProblem,
  registerCleanup,
  uniqueSuffix,
} from "./helpers";

registerCleanup();

describe("forum posts", () => {
  test("list filters by status and paginates", async () => {
    const admin = await createActor("admin");
    const category = await createTestCategory(admin);
    await createTestPost(admin, category.id);
    await createTestPost(admin, category.id);

    const page = await listPosts({
      categoryId: category.id,
      page: 1,
      limit: 1,
    });
    expect(page.total).toBe(2);
    expect(page.totalPages).toBe(2);
    expect(page.items).toHaveLength(1);

    const all = await listPosts({
      categoryId: category.id,
      page: 1,
      limit: 20,
    });
    expect(all.items).toHaveLength(2);

    const hidden = await listPosts({
      categoryId: category.id,
      status: "HIDDEN",
      page: 1,
      limit: 20,
    });
    expect(hidden.items).toHaveLength(0);
  });

  test("update edits fields; delete is a soft delete", async () => {
    const admin = await createActor("admin");
    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);

    const updated = await updatePost(
      post.id,
      { title: "Edited title", status: "ARCHIVED", isLocked: true },
      admin,
    );
    expect(updated.title).toBe("Edited title");
    expect(updated.status).toBe("ARCHIVED");
    expect(updated.isLocked).toBe(true);

    await deletePost(post.id, admin);
    const deleted = await getPost(post.id);
    expect(deleted.status).toBe("DELETED");

    await expectForumProblem(getPost(`missing-${uniqueSuffix()}`), 404);
  });
});
