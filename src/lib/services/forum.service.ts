/**
 * Forum service — server-side forum logic behind /api/v1/forums/**.
 *
 * Covers category CRUD, post/comment CRUD, the moderation queue
 * (approve/reject/hide) and user reports. The per-category
 * `requiredRole` gate (forum_categories.required_role) is enforced here,
 * on post and comment creation, so every write path goes through it
 * regardless of which route calls in.
 *
 * Rules of note:
 * - Posts created by actors without `forum:moderate` land in
 *   PENDING_REVIEW (or DRAFT when explicitly requested); actors holding
 *   `forum:moderate` publish directly. That is what feeds the queue.
 * - Post/comment deletion is soft (status -> DELETED) so reports and
 *   audit context survive; category deletion is hard and only allowed
 *   once the category is empty.
 */

import { and, asc, count, desc, eq, inArray, isNotNull, max, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import {
  forumCategory,
  forumComment,
  forumPost,
  forumReport,
  user,
  type ForumCategory,
  type ForumComment,
  type ForumPost,
  type ForumReport,
} from "@/db/schema";
import { problems, type ProblemDetails } from "@/lib/http";
import { logger } from "@/lib/logger";
import { USER_ROLES, isPredefinedRole } from "@/types/dashboard.types";
import { getRoleLevel, type Permission, type Role } from "@/types/role.types";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ForumServiceError extends Error {
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.name = "ForumServiceError";
    this.problem = problem;
  }
}

/** Maps any thrown error to a Problem; unexpected ones become 500s. */
export function forumProblemFromError(error: unknown): ProblemDetails {
  if (error instanceof ForumServiceError) return error.problem;
  logger.error("Unexpected forum service error", error);
  return problems.internalError();
}

// ---------------------------------------------------------------------------
// Actor
// ---------------------------------------------------------------------------

/** What the service needs about the acting user (routes pass auth.user). */
export interface ForumActor {
  id: string;
  role: string;
  permissions?: readonly Permission[];
}

/**
 * The per-category role gate. forum_categories.required_role holds the
 * minimum role name; actors below that level may not post or comment in
 * the category. Comparison uses the same ROLE_HIERARCHY levels that
 * rbac.ts's hasRole() uses, so superadmin (100) always passes and custom
 * roles (level 0) never pass a non-null gate. Unknown stored role names
 * fail closed for everyone but superadmin.
 */
function enforceCategoryRoleGate(
  category: Pick<ForumCategory, "id" | "requiredRole">,
  actor: ForumActor,
): void {
  const required = category.requiredRole;
  if (!required) return;

  const actorLevel = getRoleLevel(actor.role as Role);
  const requiredLevel = isPredefinedRole(required) ? getRoleLevel(required) : Infinity;

  if (actorLevel >= requiredLevel) return;

  throw new ForumServiceError(
    problems.insufficientPermission(`Category requires role ${required} or higher to post`),
  );
}

// ---------------------------------------------------------------------------
// Zod schemas (routes safeParse with these before calling the service)
// ---------------------------------------------------------------------------

export const POST_TYPES = [
  "DISCUSSION",
  "QUESTION",
  "ANNOUNCEMENT",
  "POLL",
  "RESOURCE",
  "JOB_POSTING",
  "EVENT_PROMOTION",
] as const;

export const POST_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "ARCHIVED",
  "DELETED",
  "HIDDEN",
] as const;

export const COMMENT_STATUSES = ["PUBLISHED", "PENDING", "HIDDEN", "DELETED"] as const;

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, digits and dashes");

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().max(2000).optional(),
  icon: z.string().trim().max(64).optional(),
  color: z.string().trim().max(32).optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
  isActive: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  requiredRole: z.enum(USER_ROLES).nullish(),
  parentId: z.string().min(1).nullish(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createPostSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().trim().min(1).max(300),
  content: z.string().trim().min(1).max(50000),
  type: z.enum(POST_TYPES).optional(),
  status: z.enum(POST_STATUSES).optional(),
  tags: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
});

export const updatePostSchema = z.object({
  categoryId: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(300).optional(),
  content: z.string().trim().min(1).max(50000).optional(),
  type: z.enum(POST_TYPES).optional(),
  status: z.enum(POST_STATUSES).optional(),
  isSticky: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(20000),
  parentId: z.string().min(1).optional(),
});

export const moderatePostSchema = z
  .object({
    action: z.enum(["approve", "reject", "hide"]),
    reason: z.string().trim().min(1).max(1000).optional(),
  })
  .refine((value) => value.action !== "reject" || Boolean(value.reason), {
    message: "reason is required when rejecting a post",
    path: ["reason"],
  });

export const createReportSchema = z
  .object({
    targetType: z.enum(["POST", "COMMENT"]),
    postId: z.string().min(1).optional(),
    commentId: z.string().min(1).optional(),
    reason: z.string().trim().min(1).max(1000),
  })
  .refine(
    (value) =>
      value.targetType === "POST"
        ? Boolean(value.postId) && !value.commentId
        : Boolean(value.commentId) && !value.postId,
    {
      message: "Provide exactly the target id matching targetType",
      path: ["targetType"],
    },
  );

export const resolveReportSchema = z.object({
  action: z.enum(["RESOLVED", "DISMISSED"]),
  deleteContent: z.boolean().optional(),
});

export const listPostsQuerySchema = z.object({
  categoryId: z.string().min(1).optional(),
  status: z.enum(POST_STATUSES).optional(),
  authorId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface AuthorDto {
  id: string;
  name: string;
  avatar?: string;
  role: string;
}

export interface CategoryDto extends ForumCategory {
  postCount: number;
  lastPostAt: Date | null;
}

export interface PostDto {
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
  author: AuthorDto;
  category: { id: string; name: string };
}

/** Shape the moderation queue UI renders (author/category inlined). */
export interface QueuePostDto {
  id: string;
  title: string;
  content: string;
  author: AuthorDto;
  category: { id: string; name: string };
  status: string;
  createdAt: Date;
  reportCount: number;
}

export interface CommentDto {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  status: string;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: AuthorDto;
}

export interface ReportDto {
  id: string;
  targetId: string;
  targetType: "POST" | "COMMENT";
  reason: string;
  status: string;
  reportedBy: { id: string; name: string };
  createdAt: Date;
  targetContent?: { title?: string; content: string };
}

function toAuthor(row: {
  id: string;
  name: string;
  image: string | null;
  profilePhoto: string | null;
  role: string;
}): AuthorDto {
  const avatar = row.image ?? row.profilePhoto ?? undefined;
  return {
    id: row.id,
    name: row.name,
    ...(avatar ? { avatar } : {}),
    role: row.role,
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

const CONTENT_SNIPPET_LENGTH = 280;

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function listCategories(): Promise<CategoryDto[]> {
  const [categories, stats] = await Promise.all([
    db
      .select()
      .from(forumCategory)
      .orderBy(asc(forumCategory.sortOrder), asc(forumCategory.createdAt)),
    db
      .select({
        categoryId: forumPost.categoryId,
        postCount: count(),
        lastPostAt: max(forumPost.createdAt),
      })
      .from(forumPost)
      .where(ne(forumPost.status, "DELETED"))
      .groupBy(forumPost.categoryId),
  ]);

  const statsByCategory = new Map(stats.map((row) => [row.categoryId, row]));

  return categories.map((category) => {
    const stat = statsByCategory.get(category.id);
    return {
      ...category,
      postCount: stat?.postCount ?? 0,
      lastPostAt: stat?.lastPostAt ?? null,
    };
  });
}

export async function getCategory(id: string): Promise<CategoryDto> {
  const [category] = await db.select().from(forumCategory).where(eq(forumCategory.id, id)).limit(1);
  if (!category) throw new ForumServiceError(problems.notFound("Category not found"));

  // Same stats as listCategories, but scoped to this category so fetching one
  // row doesn't aggregate the entire posts table. A flat aggregate (no GROUP
  // BY) always yields one row — count() = 0 / max() = null when nothing matches.
  const [stats] = await db
    .select({
      postCount: count(),
      lastPostAt: max(forumPost.createdAt),
    })
    .from(forumPost)
    .where(and(eq(forumPost.categoryId, id), ne(forumPost.status, "DELETED")));

  return {
    ...category,
    postCount: stats?.postCount ?? 0,
    lastPostAt: stats?.lastPostAt ?? null,
  };
}

export async function createCategory(
  input: z.infer<typeof createCategorySchema>,
  _actor: ForumActor,
): Promise<CategoryDto> {
  const slug = input.slug ?? slugify(input.name);
  if (!slug) {
    throw new ForumServiceError(
      problems.businessLogicError("Category name must contain letters or digits"),
    );
  }

  const existing = await db
    .select({ id: forumCategory.id })
    .from(forumCategory)
    .where(eq(forumCategory.name, slug))
    .limit(1);
  if (existing.length > 0) {
    throw new ForumServiceError(problems.conflict(`Category slug "${slug}" already exists`));
  }

  if (input.parentId) {
    const parent = await db
      .select({ id: forumCategory.id })
      .from(forumCategory)
      .where(eq(forumCategory.id, input.parentId))
      .limit(1);
    if (parent.length === 0) {
      throw new ForumServiceError(problems.notFound("Parent category not found"));
    }
  }

  const [row] = await db
    .insert(forumCategory)
    .values({
      name: slug,
      displayName: input.name,
      description: input.description ?? null,
      icon: input.icon ?? null,
      color: input.color ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
      isPrivate: input.isPrivate ?? false,
      requiredRole: input.requiredRole ?? null,
      parentId: input.parentId ?? null,
    })
    .returning();

  return { ...row, postCount: 0, lastPostAt: null };
}

export async function updateCategory(
  id: string,
  input: z.infer<typeof updateCategorySchema>,
  _actor: ForumActor,
): Promise<CategoryDto> {
  const current = await db.select().from(forumCategory).where(eq(forumCategory.id, id)).limit(1);
  if (current.length === 0) {
    throw new ForumServiceError(problems.notFound("Category not found"));
  }

  if (input.slug && input.slug !== current[0].name) {
    const clash = await db
      .select({ id: forumCategory.id })
      .from(forumCategory)
      .where(eq(forumCategory.name, input.slug))
      .limit(1);
    if (clash.length > 0) {
      throw new ForumServiceError(
        problems.conflict(`Category slug "${input.slug}" already exists`),
      );
    }
  }

  if (input.parentId) {
    if (input.parentId === id) {
      throw new ForumServiceError(
        problems.businessLogicError("A category cannot be its own parent"),
      );
    }
    const parent = await db
      .select({ id: forumCategory.id })
      .from(forumCategory)
      .where(eq(forumCategory.id, input.parentId))
      .limit(1);
    if (parent.length === 0) {
      throw new ForumServiceError(problems.notFound("Parent category not found"));
    }
  }

  const [row] = await db
    .update(forumCategory)
    .set({
      ...(input.name !== undefined ? { displayName: input.name } : {}),
      ...(input.slug !== undefined ? { name: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.isPrivate !== undefined ? { isPrivate: input.isPrivate } : {}),
      ...(input.requiredRole !== undefined ? { requiredRole: input.requiredRole ?? null } : {}),
      ...(input.parentId !== undefined ? { parentId: input.parentId ?? null } : {}),
    })
    .where(eq(forumCategory.id, id))
    .returning();

  return getCategory(row.id);
}

export async function deleteCategory(id: string, _actor: ForumActor): Promise<void> {
  const existing = await db
    .select({ id: forumCategory.id })
    .from(forumCategory)
    .where(eq(forumCategory.id, id))
    .limit(1);
  if (existing.length === 0) {
    throw new ForumServiceError(problems.notFound("Category not found"));
  }

  const [{ value: postTotal }] = await db
    .select({ value: count() })
    .from(forumPost)
    .where(eq(forumPost.categoryId, id));
  if (postTotal > 0) {
    throw new ForumServiceError(
      problems.conflict(`Category still contains ${postTotal} post(s); move or delete them first`),
    );
  }

  const [{ value: childTotal }] = await db
    .select({ value: count() })
    .from(forumCategory)
    .where(eq(forumCategory.parentId, id));
  if (childTotal > 0) {
    throw new ForumServiceError(
      problems.conflict("Category still has subcategories; move or delete them first"),
    );
  }

  await db.delete(forumCategory).where(eq(forumCategory.id, id));
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

const postWithJoins = () =>
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

function toPostDto(row: PostJoinRow): PostDto {
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

export async function listReports(status?: string): Promise<ReportDto[]> {
  const rows = await reportWithReporter()
    .where(status ? eq(forumReport.status, status as ForumReport["status"]) : undefined)
    .orderBy(desc(forumReport.createdAt));

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

  return rows.map((row) => {
    const targetPost = row.postId ? postById.get(row.postId) : undefined;
    const targetComment = row.commentId ? commentById.get(row.commentId) : undefined;
    const targetContent = targetPost
      ? { title: targetPost.title, content: reportSnippet(targetPost.content) }
      : targetComment
        ? { content: reportSnippet(targetComment.content) }
        : undefined;

    return toReportDto(row, targetContent);
  });
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

// Re-export row types for callers/tests that want them.
export type { ForumCategory, ForumPost, ForumComment, ForumReport };
