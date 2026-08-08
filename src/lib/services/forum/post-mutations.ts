import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { forumCategory, forumPost } from "@/db/schema";
import { problems } from "@/lib/http";
import { enforceCategoryRoleGate, type ForumActor } from "./actor";
import { ForumServiceError } from "./errors";
import { getPost } from "./post-queries";
import { createPostSchema, updatePostSchema } from "./schemas";
import type { PostDto } from "./types";

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
  } else if (actor.role === "superadmin" || (actor.permissions ?? []).includes("forum:moderate")) {
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

  // Moving a post re-runs the destination category's gate for the actor.
  if (input.categoryId && input.categoryId !== existing[0].categoryId) {
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
export async function deletePost(id: string, _actor: ForumActor): Promise<void> {
  const existing = await db
    .select({ id: forumPost.id })
    .from(forumPost)
    .where(eq(forumPost.id, id))
    .limit(1);
  if (existing.length === 0) throw new ForumServiceError(problems.notFound("Post not found"));

  await db.update(forumPost).set({ status: "DELETED" }).where(eq(forumPost.id, id));
}
