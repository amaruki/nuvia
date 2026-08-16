import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { forumCategory, forumComment, forumPost } from "@/db/schema";
import { problems } from "@/lib/http";
import { enforceCategoryRoleGate, type ForumActor } from "./actor";
import { getComment } from "./comment-queries";
import { ForumServiceError } from "./errors";
import { createCommentSchema } from "./schemas";
import type { CommentDto } from "./types";

export async function createComment(
  postId: string,
  input: z.infer<typeof createCommentSchema>,
  actor: ForumActor,
): Promise<CommentDto> {
  const post = await db
    .select({
      id: forumPost.id,
      categoryId: forumPost.categoryId,
      isLocked: forumPost.isLocked,
      status: forumPost.status,
    })
    .from(forumPost)
    .where(eq(forumPost.id, postId))
    .limit(1);
  if (post.length === 0) throw new ForumServiceError(problems.notFound("Post not found"));

  const [category] = await db
    .select({ id: forumCategory.id, requiredRole: forumCategory.requiredRole })
    .from(forumCategory)
    .where(eq(forumCategory.id, post[0].categoryId))
    .limit(1);
  if (category) {
    // Same per-category gate as post creation.
    enforceCategoryRoleGate(category, actor);
  }

  if (post[0].isLocked) {
    throw new ForumServiceError(problems.conflict("Post is locked; new comments are not allowed"));
  }
  if (
    post[0].status !== "PUBLISHED" &&
    !(actor.role === "superadmin" || (actor.permissions ?? []).includes("forum:moderate"))
  ) {
    throw new ForumServiceError(
      problems.businessLogicError("Comments are only open on published posts"),
    );
  }

  if (input.parentId) {
    const parent = await db
      .select({ id: forumComment.id, postId: forumComment.postId })
      .from(forumComment)
      .where(eq(forumComment.id, input.parentId))
      .limit(1);
    if (parent.length === 0) {
      throw new ForumServiceError(problems.notFound("Parent comment not found"));
    }
    if (parent[0].postId !== postId) {
      throw new ForumServiceError(
        problems.businessLogicError("Parent comment belongs to a different post"),
      );
    }
  }

  const [row] = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(forumComment)
      .values({
        postId,
        userId: actor.id,
        content: input.content,
        parentId: input.parentId ?? null,
        status: "PUBLISHED",
      })
      .returning({ id: forumComment.id });

    await tx
      .update(forumPost)
      .set({
        replyCount: sql`${forumPost.replyCount} + 1`,
        lastReplyAt: new Date(),
      })
      .where(eq(forumPost.id, postId));

    return [inserted];
  });

  return getComment(row.id);
}

/** Soft delete; decrements the post's reply counter for published replies. */
export async function deleteComment(id: string, _actor: ForumActor): Promise<void> {
  const existing = await db
    .select({ id: forumComment.id })
    .from(forumComment)
    .where(eq(forumComment.id, id))
    .limit(1);
  if (existing.length === 0) {
    throw new ForumServiceError(problems.notFound("Comment not found"));
  }

  await db.transaction(async (tx) => {
    await softDeleteComment(tx, id);
  });
}

/** Transaction context of this module's drizzle client (`db.transaction`'s tx). */
export type ForumCommentTx = Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];

/**
 * Soft-delete one comment while keeping the post's reply counter consistent
 * (issue #28). The conditional flip (`WHERE status = 'PUBLISHED'`) is atomic
 * in Postgres, so exactly one concurrent deleter wins a published comment and
 * decrements the counter; `GREATEST(..., 0)` additionally floors the counter
 * against drift accumulated before migration 0016. Comments in other statuses
 * still soft-delete but never counted toward the reply total, so they skip
 * the decrement. Shared by the direct delete route and report resolution so
 * the two paths cannot drift apart again.
 */
export async function softDeleteComment(tx: ForumCommentTx, commentId: string): Promise<void> {
  const flipped = await tx
    .update(forumComment)
    .set({ status: "DELETED" })
    .where(and(eq(forumComment.id, commentId), eq(forumComment.status, "PUBLISHED")))
    .returning({ postId: forumComment.postId });

  if (flipped.length > 0) {
    await tx
      .update(forumPost)
      .set({ replyCount: sql`GREATEST(${forumPost.replyCount} - 1, 0)` })
      .where(eq(forumPost.id, flipped[0].postId));
    return;
  }

  await tx.update(forumComment).set({ status: "DELETED" }).where(eq(forumComment.id, commentId));
}
