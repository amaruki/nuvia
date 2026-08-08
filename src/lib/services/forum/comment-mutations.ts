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
    .select({
      id: forumComment.id,
      postId: forumComment.postId,
      status: forumComment.status,
    })
    .from(forumComment)
    .where(eq(forumComment.id, id))
    .limit(1);
  if (existing.length === 0) {
    throw new ForumServiceError(problems.notFound("Comment not found"));
  }

  const wasPublished = existing[0].status === "PUBLISHED";

  await db.transaction(async (tx) => {
    await tx.update(forumComment).set({ status: "DELETED" }).where(eq(forumComment.id, id));
    if (wasPublished) {
      await tx
        .update(forumPost)
        .set({ replyCount: sql`${forumPost.replyCount} - 1` })
        .where(and(eq(forumPost.id, existing[0].postId)));
    }
  });
}
