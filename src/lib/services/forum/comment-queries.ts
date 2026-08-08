import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { forumComment, forumPost, user } from "@/db/schema";
import { problems } from "@/lib/http";
import { ForumServiceError } from "./errors";
import { toAuthor } from "./helpers";
import type { CommentDto } from "./types";

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function listComments(postId: string): Promise<CommentDto[]> {
  const post = await db
    .select({ id: forumPost.id })
    .from(forumPost)
    .where(eq(forumPost.id, postId))
    .limit(1);
  if (post.length === 0) throw new ForumServiceError(problems.notFound("Post not found"));

  const rows = await db
    .select({
      id: forumComment.id,
      postId: forumComment.postId,
      parentId: forumComment.parentId,
      content: forumComment.content,
      status: forumComment.status,
      likeCount: forumComment.likeCount,
      createdAt: forumComment.createdAt,
      updatedAt: forumComment.updatedAt,
      authorId: user.id,
      authorName: user.name,
      authorImage: user.image,
      authorProfilePhoto: user.profilePhoto,
      authorRole: user.role,
    })
    .from(forumComment)
    .innerJoin(user, eq(forumComment.userId, user.id))
    .where(eq(forumComment.postId, postId))
    .orderBy(asc(forumComment.createdAt));

  return rows.map((row) => ({
    id: row.id,
    postId: row.postId,
    parentId: row.parentId,
    content: row.content,
    status: row.status,
    likeCount: row.likeCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: toAuthor({
      id: row.authorId,
      name: row.authorName,
      image: row.authorImage,
      profilePhoto: row.authorProfilePhoto,
      role: row.authorRole,
    }),
  }));
}

export async function getComment(id: string): Promise<CommentDto> {
  const [comment] = await listCommentsForIds([id]);
  if (!comment) throw new ForumServiceError(problems.notFound("Comment not found"));
  return comment;
}

async function listCommentsForIds(ids: string[]): Promise<CommentDto[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select({
      id: forumComment.id,
      postId: forumComment.postId,
      parentId: forumComment.parentId,
      content: forumComment.content,
      status: forumComment.status,
      likeCount: forumComment.likeCount,
      createdAt: forumComment.createdAt,
      updatedAt: forumComment.updatedAt,
      authorId: user.id,
      authorName: user.name,
      authorImage: user.image,
      authorProfilePhoto: user.profilePhoto,
      authorRole: user.role,
    })
    .from(forumComment)
    .innerJoin(user, eq(forumComment.userId, user.id))
    .where(inArray(forumComment.id, ids));

  return rows.map((row) => ({
    id: row.id,
    postId: row.postId,
    parentId: row.parentId,
    content: row.content,
    status: row.status,
    likeCount: row.likeCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: toAuthor({
      id: row.authorId,
      name: row.authorName,
      image: row.authorImage,
      profilePhoto: row.authorProfilePhoto,
      role: row.authorRole,
    }),
  }));
}
