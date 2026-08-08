import { describe, expect, test } from "bun:test";
import {
  createComment,
  deleteComment,
  getComment,
  getPost,
  listComments,
  updatePost,
} from "@/lib/services/forum";
import {
  createActor,
  createTestCategory,
  createTestComment,
  createTestPost,
  expectForumProblem,
  registerCleanup,
  uniqueSuffix,
} from "./helpers";

registerCleanup();

describe("forum comments", () => {
  test("create bumps replyCount and lastReplyAt; list returns them", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);
    expect(post.replyCount).toBe(0);
    expect(post.lastReplyAt).toBeNull();

    const comment = await createTestComment(member, post.id);
    expect(comment.author.id).toBe(member.id);
    expect(comment.status).toBe("PUBLISHED");

    const reloaded = await getPost(post.id);
    expect(reloaded.replyCount).toBe(1);
    expect(reloaded.lastReplyAt).not.toBeNull();

    const comments = await listComments(post.id);
    expect(comments.some((row) => row.id === comment.id)).toBe(true);

    const single = await getComment(comment.id);
    expect(single.postId).toBe(post.id);
  });

  test("locked posts refuse new comments", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);
    await updatePost(post.id, { isLocked: true }, admin);

    await expectForumProblem(createComment(post.id, { content: "Should be blocked" }, member), 409);
  });

  test("non-moderators cannot comment on unpublished posts", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const pending = await createTestPost(member, category.id); // PENDING_REVIEW

    await expectForumProblem(createComment(pending.id, { content: "Too early" }, member), 400);
  });

  test("parent comment must belong to the same post", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const postA = await createTestPost(admin, category.id);
    const postB = await createTestPost(admin, category.id);
    const parentOnB = await createTestComment(admin, postB.id);

    await expectForumProblem(
      createComment(postA.id, { content: "Wrong parent", parentId: parentOnB.id }, member),
      400,
    );

    const reply = await createTestComment(member, postB.id, {
      parentId: parentOnB.id,
    });
    expect(reply.parentId).toBe(parentOnB.id);
  });

  test("delete soft-deletes and decrements replyCount", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);
    const comment = await createTestComment(member, post.id);

    await deleteComment(comment.id, admin);
    const reloadedComment = await getComment(comment.id);
    expect(reloadedComment.status).toBe("DELETED");

    const reloadedPost = await getPost(post.id);
    expect(reloadedPost.replyCount).toBe(0);

    await expectForumProblem(deleteComment(`missing-${uniqueSuffix()}`, admin), 404);
  });
});
