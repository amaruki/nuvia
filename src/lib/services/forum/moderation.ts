import { and, asc, count, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { forumPost, forumReport } from "@/db/schema";
import { problems } from "@/lib/http";
import type { ForumActor } from "./actor";
import { ForumServiceError } from "./errors";
import { getPost, postWithJoins, toPostDto } from "./post-queries";
import { moderatePostSchema } from "./schemas";
import type { PostDto, QueuePostDto } from "./types";

// ---------------------------------------------------------------------------
// Moderation
// ---------------------------------------------------------------------------

/** Posts awaiting review, oldest first, with pending-report counts. */
export async function getModerationQueue(): Promise<QueuePostDto[]> {
  const rows = await postWithJoins()
    .where(eq(forumPost.status, "PENDING_REVIEW"))
    .orderBy(asc(forumPost.createdAt));

  const reportCounts = await db
    .select({ postId: forumReport.postId, pending: count() })
    .from(forumReport)
    .where(and(eq(forumReport.status, "PENDING"), isNotNull(forumReport.postId)))
    .groupBy(forumReport.postId);
  const pendingByPost = new Map(reportCounts.map((row) => [row.postId as string, row.pending]));

  return rows.map((row) => {
    const dto = toPostDto(row);
    return {
      id: dto.id,
      title: dto.title,
      content: dto.content,
      author: dto.author,
      category: dto.category,
      status: dto.status,
      createdAt: dto.createdAt,
      reportCount: pendingByPost.get(dto.id) ?? 0,
    };
  });
}

export async function moderatePost(
  postId: string,
  action: z.infer<typeof moderatePostSchema>,
  actor: ForumActor,
): Promise<PostDto> {
  const existing = await db
    .select({ id: forumPost.id, metadata: forumPost.metadata })
    .from(forumPost)
    .where(eq(forumPost.id, postId))
    .limit(1);
  if (existing.length === 0) throw new ForumServiceError(problems.notFound("Post not found"));

  const status = action.action === "approve" ? "PUBLISHED" : "HIDDEN";
  const moderation: Record<string, unknown> = {
    action: action.action,
    by: actor.id,
    at: new Date().toISOString(),
  };
  if (action.reason) moderation.reason = action.reason;

  await db
    .update(forumPost)
    .set({
      status,
      metadata: {
        ...(typeof existing[0].metadata === "object" && existing[0].metadata !== null
          ? (existing[0].metadata as Record<string, unknown>)
          : {}),
        moderation,
      },
    })
    .where(eq(forumPost.id, postId));

  return getPost(postId);
}
