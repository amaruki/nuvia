import { describe, expect, test } from "bun:test";
import { createComment, createPost, updatePost } from "@/lib/services/forum";
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

describe("per-category requiredRole gate", () => {
  test("member below the gate cannot post; committee_chair and admin can", async () => {
    const admin = await createActor("admin");
    const chair = await createActor("committee_chair"); // level 60, no forum:moderate
    const member = await createActor("member");

    const gated = await createTestCategory(admin, {
      requiredRole: "moderator",
    }); // level 50

    await expectForumProblem(
      createPost(
        {
          categoryId: gated.id,
          title: "Blocked post",
          content: "Should not pass the gate.",
        },
        member,
      ),
      403,
    );

    // committee_chair clears the gate but does not hold forum:moderate,
    // so the post lands in the moderation queue.
    const chairPost = await createTestPost(chair, gated.id);
    expect(chairPost.status).toBe("PENDING_REVIEW");

    // admin clears the gate AND moderates, so the post publishes directly.
    const adminPost = await createTestPost(admin, gated.id);
    expect(adminPost.status).toBe("PUBLISHED");
  });

  test("the gate also covers comment creation (via the post's category)", async () => {
    const admin = await createActor("admin");
    const staff = await createActor("staff");
    const member = await createActor("member");

    const gated = await createTestCategory(admin, { requiredRole: "staff" });
    const post = await createTestPost(admin, gated.id);

    await expectForumProblem(createComment(post.id, { content: "Blocked comment" }, member), 403);

    const comment = await createTestComment(staff, post.id);
    expect(comment.status).toBe("PUBLISHED");
  });

  test("a role at exactly the required level passes", async () => {
    const admin = await createActor("admin");
    const moderator = await createActor("moderator");

    const gated = await createTestCategory(admin, {
      requiredRole: "moderator",
    });
    const post = await createTestPost(moderator, gated.id);
    expect(post.status).toBe("PUBLISHED"); // moderator holds forum:moderate
  });

  test("custom roles sit at level 0 and fail any predefined gate", async () => {
    const admin = await createActor("admin");
    const custom = await createActor(`custom_forum_role_${uniqueSuffix()}`);

    const gated = await createTestCategory(admin, { requiredRole: "member" });
    await expectForumProblem(
      createPost(
        {
          categoryId: gated.id,
          title: "Custom role post",
          content: "Gate should block.",
        },
        custom,
      ),
      403,
    );

    // Ungated category stays open to everyone.
    const open = await createTestCategory(admin);
    const post = await createTestPost(custom, open.id);
    expect(post.status).toBe("PENDING_REVIEW");
  });

  test("moving a post re-runs the destination category gate", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const open = await createTestCategory(admin);
    const gated = await createTestCategory(admin, { requiredRole: "staff" });
    const post = await createTestPost(member, open.id);

    // Member tries to move their post into the gated category.
    await expectForumProblem(updatePost(post.id, { categoryId: gated.id }, member), 403);

    // Admin can move it.
    const moved = await updatePost(post.id, { categoryId: gated.id }, admin);
    expect(moved.categoryId).toBe(gated.id);
  });
});
