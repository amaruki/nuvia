import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { forumCategory, forumPost, user } from "@/db/schema";
import { problems } from "@/lib/http";
import { ForumServiceError } from "./errors";
import { toAuthor } from "./helpers";
import { listPostsQuerySchema } from "./schemas";
import type { PostDto } from "./types";

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export const postWithJoins = () =>
  db
    .select({
      id: forumPost.id,
      categoryId: forumPost.categoryId,
      title: forumPost.title,
      content: forumPost.content,
      type: forumPost.type,
      status: forumPost.status,
      isSticky: forumPost.isSticky,
      isLocked: forumPost.isLocked,
      views: forumPost.views,
      likeCount: forumPost.likeCount,
      replyCount: forumPost.replyCount,
      lastReplyAt: forumPost.lastReplyAt,
      tags: forumPost.tags,
      createdAt: forumPost.createdAt,
      updatedAt: forumPost.updatedAt,
      authorId: user.id,
      authorName: user.name,
      authorImage: user.image,
      authorProfilePhoto: user.profilePhoto,
      authorRole: user.role,
      categoryName: forumCategory.displayName,
    })
    .from(forumPost)
    .innerJoin(user, eq(forumPost.userId, user.id))
    .innerJoin(forumCategory, eq(forumPost.categoryId, forumCategory.id));

interface PostJoinRow {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  type: string;
  status: string;
  isSticky: boolean;
  isLocked: boolean;
  views: number;
  likeCount: number;
  replyCount: number;
  lastReplyAt: Date | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  authorProfilePhoto: string | null;
  authorRole: string;
  categoryName: string;
}

export function toPostDto(row: PostJoinRow): PostDto {
  return {
    id: row.id,
    categoryId: row.categoryId,
    title: row.title,
    content: row.content,
    type: row.type,
    status: row.status,
    isSticky: row.isSticky,
    isLocked: row.isLocked,
    views: row.views,
    likeCount: row.likeCount,
    replyCount: row.replyCount,
    lastReplyAt: row.lastReplyAt,
    tags: row.tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: toAuthor({
      id: row.authorId,
      name: row.authorName,
      image: row.authorImage,
      profilePhoto: row.authorProfilePhoto,
      role: row.authorRole,
    }),
    category: { id: row.categoryId, name: row.categoryName },
  };
}

export async function listPosts(query: z.infer<typeof listPostsQuerySchema>): Promise<{
  items: PostDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  const filters = [
    query.categoryId ? eq(forumPost.categoryId, query.categoryId) : undefined,
    query.status ? eq(forumPost.status, query.status) : undefined,
    query.authorId ? eq(forumPost.userId, query.authorId) : undefined,
  ].filter(Boolean);
  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const [{ value: total }] = await db.select({ value: count() }).from(forumPost).where(whereClause);

  const rows = await postWithJoins()
    .where(whereClause)
    .orderBy(desc(forumPost.createdAt))
    .limit(query.limit)
    .offset((query.page - 1) * query.limit);

  return {
    items: rows.map(toPostDto),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getPost(id: string): Promise<PostDto> {
  const rows = await postWithJoins().where(eq(forumPost.id, id)).limit(1);
  if (rows.length === 0) throw new ForumServiceError(problems.notFound("Post not found"));
  return toPostDto(rows[0]);
}
