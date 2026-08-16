/**
 * Issue #25 regression guards — forum post lifecycle.
 *
 * Before the fix, `updatePost` applied status/isSticky/isLocked verbatim
 * with no ownership or moderation check (a moderator could self-approve,
 * or resurrect/lock anything), and `moderatePost` read only id+metadata so
 * approve could resurrect a DELETED post. `deletePost`'s actor was unused.
 *
 * These tests pin the new state machine: only forum:moderate (or an
 * author's submit/retract) may move a post's status; moderators cannot
 * self-approve; DELETED is terminal on both the PATCH and moderation paths;
 * and ownership is consulted on edit and delete.
 */

import { describe, expect, test } from "bun:test";
import { deletePost, getPost, moderatePost, updatePost } from "@/lib/services/forum";
import {
  createActor,
  createTestCategory,
  createTestPost,
  expectForumProblem,
  registerCleanup,
} from "./helpers";

registerCleanup();

describe("forum post lifecycle (issue #25)", () => {
  test("a moderator cannot self-approve their own pending post", async () => {
    const admin = await createActor("admin");
    const moderator = await createActor("moderator");
    const category = await createTestCategory(admin);

    // The moderator authors a DRAFT (service-level create, no route gate),
    // then submits it to review — both legal author moves.
    const draft = await createTestPost(moderator, category.id, { status: "DRAFT" });
    const submitted = await updatePost(draft.id, { status: "PENDING_REVIEW" }, moderator);
    expect(submitted.status).toBe("PENDING_REVIEW");

    // Self-approval must fail.
    await expectForumProblem(updatePost(draft.id, { status: "PUBLISHED" }, moderator), 403);

    // A different moderator can approve it.
    const other = await createActor("moderator");
    const approved = await updatePost(draft.id, { status: "PUBLISHED" }, other);
    expect(approved.status).toBe("PUBLISHED");
  });

  test("a non-moderator author may submit and retract but not self-publish", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");
    const category = await createTestCategory(admin);

    const draft = await createTestPost(member, category.id, { status: "DRAFT" });
    expect(draft.status).toBe("DRAFT");

    // Submit for review (DRAFT -> PENDING_REVIEW).
    const submitted = await updatePost(draft.id, { status: "PENDING_REVIEW" }, member);
    expect(submitted.status).toBe("PENDING_REVIEW");

    // Retract (PENDING_REVIEW -> DRAFT).
    const retracted = await updatePost(draft.id, { status: "DRAFT" }, member);
    expect(retracted.status).toBe("DRAFT");

    // Self-publish must fail (DRAFT -> PUBLISHED is not an author move).
    await expectForumProblem(updatePost(draft.id, { status: "PUBLISHED" }, member), 403);
  });

  test("status/sticky/locked are moderation decisions", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");
    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);

    // A member cannot pin or lock someone else's post.
    await expectForumProblem(updatePost(post.id, { isSticky: true }, member), 403);
    await expectForumProblem(updatePost(post.id, { isLocked: true }, member), 403);

    // A moderator can.
    const pinned = await updatePost(post.id, { isSticky: true, isLocked: true }, admin);
    expect(pinned.isSticky).toBe(true);
    expect(pinned.isLocked).toBe(true);
  });

  test("ownership is consulted on edit", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");
    const other = await createActor("member");
    const category = await createTestCategory(admin);
    const post = await createTestPost(member, category.id, { status: "DRAFT" });

    // Another member cannot edit it.
    await expectForumProblem(updatePost(post.id, { title: "Not yours" }, other), 403);

    // The author can.
    const edited = await updatePost(post.id, { title: "Mine" }, member);
    expect(edited.title).toBe("Mine");
  });

  test("ownership is consulted on delete", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");
    const other = await createActor("member");
    const category = await createTestCategory(admin);
    const post = await createTestPost(member, category.id, { status: "DRAFT" });

    await expectForumProblem(deletePost(post.id, other), 403);

    await deletePost(post.id, member);
    const deleted = await getPost(post.id);
    expect(deleted.status).toBe("DELETED");
  });

  test("DELETED is terminal: no resurrection via PATCH", async () => {
    const admin = await createActor("admin");
    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);

    await deletePost(post.id, admin);

    await expectForumProblem(updatePost(post.id, { status: "PUBLISHED" }, admin), 404);
  });

  test("DELETED is terminal: no resurrection via moderation approve", async () => {
    const admin = await createActor("admin");
    const moderator = await createActor("moderator");
    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);

    await deletePost(post.id, admin);

    await expectForumProblem(moderatePost(post.id, { action: "approve" }, moderator), 409);
  });

  test("moderatePost cannot re-approve an already-published post", async () => {
    const admin = await createActor("admin");
    const moderator = await createActor("moderator");
    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id); // PUBLISHED directly

    await expectForumProblem(moderatePost(post.id, { action: "approve" }, moderator), 409);
  });
});
