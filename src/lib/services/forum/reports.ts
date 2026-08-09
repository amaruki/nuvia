import { count, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { forumComment, forumPost, forumReport, user, type ForumReport } from "@/db/schema";
import { problems } from "@/lib/http";
import type { ForumActor } from "./actor";
import { ForumServiceError } from "./errors";
import { createReportSchema, resolveReportSchema } from "./schemas";
import type { ReportDto } from "./types";

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

const reportWithReporter = () =>
  db
    .select({
      id: forumReport.id,
      targetType: forumReport.targetType,
      postId: forumReport.postId,
      commentId: forumReport.commentId,
      reason: forumReport.reason,
      status: forumReport.status,
      createdAt: forumReport.createdAt,
      reportedById: user.id,
      reportedByName: user.name,
    })
    .from(forumReport)
    .innerJoin(user, eq(forumReport.reportedById, user.id));

interface ReportJoinRow {
  id: string;
  targetType: ForumReport["targetType"];
  postId: string | null;
  commentId: string | null;
  reason: string;
  status: ForumReport["status"];
  createdAt: Date;
  reportedById: string;
  reportedByName: string;
}

const CONTENT_SNIPPET_LENGTH = 280;

/** Caps report previews so long post/comment bodies stay bounded. */
function reportSnippet(content: string): string {
  return content.length > CONTENT_SNIPPET_LENGTH
    ? `${content.slice(0, CONTENT_SNIPPET_LENGTH)}…`
    : content;
}

function toReportDto(row: ReportJoinRow, targetContent?: ReportDto["targetContent"]): ReportDto {
  return {
    id: row.id,
    targetId: (row.postId ?? row.commentId) as string,
    targetType: row.targetType,
    reason: row.reason,
    status: row.status,
    reportedBy: { id: row.reportedById, name: row.reportedByName },
    createdAt: row.createdAt,
    ...(targetContent ? { targetContent } : {}),
  };
}

/**
 * Loads one report with the same relations listReports inlines, so write
 * paths can return the row they touched without scanning the whole table.
 */
async function getReportDto(id: string): Promise<ReportDto | undefined> {
  const [row] = await reportWithReporter().where(eq(forumReport.id, id)).limit(1);
  if (!row) return undefined;

  // Exactly one of postId/commentId is set (createReportSchema enforces it);
  // targets are fetched without a status filter, as listReports shows them.
  let targetContent: ReportDto["targetContent"];
  if (row.postId) {
    const [post] = await db
      .select({ title: forumPost.title, content: forumPost.content })
      .from(forumPost)
      .where(eq(forumPost.id, row.postId))
      .limit(1);
    if (post) targetContent = { title: post.title, content: reportSnippet(post.content) };
  } else if (row.commentId) {
    const [comment] = await db
      .select({ content: forumComment.content })
      .from(forumComment)
      .where(eq(forumComment.id, row.commentId))
      .limit(1);
    if (comment) targetContent = { content: reportSnippet(comment.content) };
  }

  return toReportDto(row, targetContent);
}

export interface ReportListResult {
  items: ReportDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function listReports(
  status?: string,
  pagination: { page?: number; limit?: number } = {},
): Promise<ReportListResult> {
  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? 20;
  const statusFilter = status ? eq(forumReport.status, status as ForumReport["status"]) : undefined;

  const [totalRow] = await db.select({ total: count() }).from(forumReport).where(statusFilter);
  const total = totalRow?.total ?? 0;

  const rows = await reportWithReporter()
    .where(statusFilter)
    .orderBy(desc(forumReport.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const postIds = rows.map((row) => row.postId).filter((id): id is string => Boolean(id));
  const commentIds = rows.map((row) => row.commentId).filter((id): id is string => Boolean(id));

  const [posts, comments] = await Promise.all([
    postIds.length > 0
      ? db
          .select({
            id: forumPost.id,
            title: forumPost.title,
            content: forumPost.content,
          })
          .from(forumPost)
          .where(inArray(forumPost.id, postIds))
      : Promise.resolve([]),
    commentIds.length > 0
      ? db
          .select({ id: forumComment.id, content: forumComment.content })
          .from(forumComment)
          .where(inArray(forumComment.id, commentIds))
      : Promise.resolve([]),
  ]);
  const postById = new Map(posts.map((post) => [post.id, post]));
  const commentById = new Map(comments.map((comment) => [comment.id, comment]));

  const items = rows.map((row) => {
    const targetPost = row.postId ? postById.get(row.postId) : undefined;
    const targetComment = row.commentId ? commentById.get(row.commentId) : undefined;
    const targetContent = targetPost
      ? { title: targetPost.title, content: reportSnippet(targetPost.content) }
      : targetComment
        ? { content: reportSnippet(targetComment.content) }
        : undefined;

    return toReportDto(row, targetContent);
  });

  return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function createReport(
  input: z.infer<typeof createReportSchema>,
  actor: ForumActor,
): Promise<ReportDto> {
  if (input.targetType === "POST") {
    const post = await db
      .select({ id: forumPost.id })
      .from(forumPost)
      .where(eq(forumPost.id, input.postId as string))
      .limit(1);
    if (post.length === 0) throw new ForumServiceError(problems.notFound("Post not found"));
  } else {
    const comment = await db
      .select({ id: forumComment.id })
      .from(forumComment)
      .where(eq(forumComment.id, input.commentId as string))
      .limit(1);
    if (comment.length === 0) {
      throw new ForumServiceError(problems.notFound("Comment not found"));
    }
  }

  const [inserted] = await db
    .insert(forumReport)
    .values({
      targetType: input.targetType,
      postId: input.targetType === "POST" ? (input.postId as string) : null,
      commentId: input.targetType === "COMMENT" ? (input.commentId as string) : null,
      reason: input.reason,
      reportedById: actor.id,
    })
    .returning({ id: forumReport.id });

  const created = await getReportDto(inserted.id);
  if (!created) throw new ForumServiceError(problems.notFound("Report not found"));
  return created;
}

export async function resolveReport(
  id: string,
  input: z.infer<typeof resolveReportSchema>,
  actor: ForumActor,
): Promise<ReportDto> {
  const existing = await db.select().from(forumReport).where(eq(forumReport.id, id)).limit(1);
  if (existing.length === 0) throw new ForumServiceError(problems.notFound("Report not found"));
  if (existing[0].status !== "PENDING") {
    throw new ForumServiceError(problems.conflict("Report has already been resolved"));
  }

  if (input.deleteContent) {
    if (existing[0].postId) {
      await db
        .update(forumPost)
        .set({ status: "DELETED" })
        .where(eq(forumPost.id, existing[0].postId));
    } else if (existing[0].commentId) {
      await db
        .update(forumComment)
        .set({ status: "DELETED" })
        .where(eq(forumComment.id, existing[0].commentId));
    }
  }

  await db
    .update(forumReport)
    .set({
      status: input.action,
      resolvedById: actor.id,
      resolvedAt: new Date(),
    })
    .where(eq(forumReport.id, id));

  const resolved = await getReportDto(id);
  if (!resolved) throw new ForumServiceError(problems.notFound("Report not found"));
  return resolved;
}
