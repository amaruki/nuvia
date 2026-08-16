import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { forumCategory, forumPost } from "@/db/schema";
import { problems } from "@/lib/http";
import { actorCanModerate, enforceCategoryRoleGate, type ForumActor } from "./actor";
import { ForumServiceError } from "./errors";
import { getPost } from "./post-queries";
import { createPostSchema, POST_STATUSES, updatePostSchema } from "./schemas";
import type { PostDto } from "./types";

type PostStatus = (typeof POST_STATUSES)[number];

/**
 * Issue #25: forum post lifecycle. Status changes are moderation decisions;
 * DELETED is terminal (no resurrection via PATCH) and transitions into
 * PUBLISHED require forum:moderate and never apply to the moderator's own
 * post (no self-approval).
 */
const MODERATOR_POST_TRANSITIONS: Record<PostStatus, readonly PostStatus[]> = {
  DRAFT: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["PUBLISHED", "HIDDEN", "DRAFT"],
  PUBLISHED: ["HIDDEN", "ARCHIVED"],
  ARCHIVED: ["PUBLISHED", "HIDDEN"],
  HIDDEN: ["PUBLISHED", "ARCHIVED"],
  DELETED: [],
};

/** The only status moves a non-moderator author may make on their own post. */
const AUTHOR_POST_TRANSITIONS: Record<PostStatus, readonly PostStatus[]> = {
  DRAFT: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["DRAFT"],
  PUBLISHED: [],
  ARCHIVED: [],
  DELETED: [],
  HIDDEN: [],
};

export async function createPost(
  input: z.infer<typeof createPostSchema>,
  actor: ForumActor,
): Promise<PostDto> {
  const category = await db
    .select()
    .from(forumCategory)
    .where(eq(forumCategory.id, input.categoryId))
    .limit(1);
  if (category.length === 0) {
    throw new ForumServiceError(problems.notFound("Category not found"));
  }
  if (!category[0].isActive) {
    throw new ForumServiceError(problems.conflict("Category is not active"));
  }

  // Per-category role gate — the category row carries it.
  enforceCategoryRoleGate(category[0], actor);

  // Actors without moderation power cannot publish straight: their posts
  // queue in PENDING_REVIEW (drafts stay drafts).
  let status: z.infer<typeof createPostSchema>["status"];
  if (input.status === "DRAFT") {
    status = "DRAFT";
  } else if (actorCanModerate(actor)) {
    status = input.status ?? "PUBLISHED";
  } else {
    status = "PENDING_REVIEW";
  }

  const [row] = await db
    .insert(forumPost)
    .values({
      categoryId: input.categoryId,
      userId: actor.id,
      title: input.title,
      content: input.content,
      type: input.type ?? "DISCUSSION",
      status,
      tags: input.tags ?? [],
    })
    .returning({ id: forumPost.id });

  return getPost(row.id);
}

export async function updatePost(
  id: string,
  input: z.infer<typeof updatePostSchema>,
  actor: ForumActor,
): Promise<PostDto> {
  const existing = await db.select().from(forumPost).where(eq(forumPost.id, id)).limit(1);
  if (existing.length === 0) throw new ForumServiceError(problems.notFound("Post not found"));

  const post = existing[0];
  const currentStatus = post.status as PostStatus;
  const isAuthor = post.userId === actor.id;
  const moderator = actorCanModerate(actor);

  // Issue #25: DELETED is terminal. A soft-deleted post cannot be edited or
  // resurrected through the PATCH endpoint (the moderation endpoint enforces
  // the same guard separately).
  if (currentStatus === "DELETED") {
    throw new ForumServiceError(problems.notFound("Post not found"));
  }

  // Issue #25: status/sticky/locked are moderation decisions. Only actors
  // holding forum:moderate may touch them; an author may submit (DRAFT ->
  // PENDING_REVIEW) or retract (PENDING_REVIEW -> DRAFT) their own post, but
  // can never self-approve or un-publish.
  const requestedStatus = input.status as PostStatus | undefined;
  const touchesModerationFields =
    requestedStatus !== undefined || input.isSticky !== undefined || input.isLocked !== undefined;

  if (touchesModerationFields) {
    if (!moderator) {
      if (input.isSticky !== undefined || input.isLocked !== undefined) {
        throw new ForumServiceError(
          problems.insufficientPermission("Pinning or locking a post requires forum:moderate"),
        );
      }
      const allowed = AUTHOR_POST_TRANSITIONS[currentStatus];
      if (requestedStatus !== currentStatus && !allowed.includes(requestedStatus!)) {
        throw new ForumServiceError(
          problems.insufficientPermission(
            "Changing a post's status requires forum:moderate; authors may only submit or retract their own post for review",
          ),
        );
      }
    } else if (requestedStatus !== undefined && requestedStatus !== currentStatus) {
      const allowed = MODERATOR_POST_TRANSITIONS[currentStatus];
      if (!allowed.includes(requestedStatus)) {
        throw new ForumServiceError(
          problems.conflict(
            `Cannot change post status from ${currentStatus} to ${requestedStatus}`,
          ),
        );
      }
      // Issue #25: no self-approval. Publishing is a moderation decision, and
      // a moderator cannot approve their own post out of the review queue.
      if (requestedStatus === "PUBLISHED" && currentStatus === "PENDING_REVIEW" && isAuthor) {
        throw new ForumServiceError(
          problems.insufficientPermission(
            "Moderators cannot approve their own post; another moderator must review it",
          ),
        );
      }
    }
  }

  // Issue #25: ownership. Non-moderators may only edit their own post's
  // content fields; moderators can edit anything (their job is moderation).
  if (!isAuthor && !moderator) {
    throw new ForumServiceError(
      problems.insufficientPermission("Only the author or a moderator can edit this post"),
    );
  }

  // Moving a post re-runs the destination category's gate for the actor.
  if (input.categoryId && input.categoryId !== post.categoryId) {
    const category = await db
      .select()
      .from(forumCategory)
      .where(eq(forumCategory.id, input.categoryId))
      .limit(1);
    if (category.length === 0) {
      throw new ForumServiceError(problems.notFound("Category not found"));
    }
    if (!category[0].isActive) {
      throw new ForumServiceError(problems.conflict("Category is not active"));
    }
    enforceCategoryRoleGate(category[0], actor);
  }

  await db
    .update(forumPost)
    .set({
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.isSticky !== undefined ? { isSticky: input.isSticky } : {}),
      ...(input.isLocked !== undefined ? { isLocked: input.isLocked } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
    })
    .where(eq(forumPost.id, id));

  return getPost(id);
}

/** Soft delete — keeps reports/audit intact; comments stay reachable. */
export async function deletePost(id: string, actor: ForumActor): Promise<void> {
  const existing = await db
    .select({ id: forumPost.id, userId: forumPost.userId, status: forumPost.status })
    .from(forumPost)
    .where(eq(forumPost.id, id))
    .limit(1);
  if (existing.length === 0) throw new ForumServiceError(problems.notFound("Post not found"));

  // Issue #25: ownership is now consulted on delete. Only the author or a
  // moderator may delete a post.
  if (existing[0].userId !== actor.id && !actorCanModerate(actor)) {
    throw new ForumServiceError(
      problems.insufficientPermission("Only the author or a moderator can delete this post"),
    );
  }

  await db.update(forumPost).set({ status: "DELETED" }).where(eq(forumPost.id, id));
}
