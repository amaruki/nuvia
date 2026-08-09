/**
 * Public forum reading surface (UI-27) — ring-0/ring-1 read path.
 *
 * The (public)/forums pages call these functions from server components with
 * NO permission gate in front of them (mirroring the public-news pattern in
 * src/lib/services/content/public-news.ts), so THIS MODULE is the security
 * boundary. Two independent gates hold at once:
 *
 *   1. AUDIENCE GATE (decision D8 — hybrid per category). Members-only
 *      reading by default; admins open categories to anonymous readers:
 *        - inactive categories are visible to nobody;
 *        - anonymous readers see only categories that are NOT `isPrivate`
 *          and carry NO `requiredRole`;
 *        - signed-in readers additionally see `isPrivate` categories and any
 *          category whose `requiredRole` their role level satisfies — the
 *          same ROLE_HIERARCHY comparison as the write gate in ./actor.ts
 *          (unknown stored role names fail closed; custom roles sit at
 *          level 0).
 *
 *   2. STATUS GATE. Only PUBLISHED posts and PUBLISHED comments surface —
 *      PENDING_REVIEW, HIDDEN, DELETED, DRAFT and ARCHIVED posts (and
 *      PENDING/HIDDEN/DELETED comments) never leave the moderation side,
 *      for any reader.
 *
 * The projection is an exact allow-list: no emails, no author role, no
 * gating columns (isPrivate/requiredRole), no moderation status vocabulary,
 * no metadata blobs. Authors degrade to null when the user row is gone or
 * soft-deleted (left join with deletedAt IS NULL), matching public-news.
 *
 * Pinned end-to-end by tests/forums-public-read.test.ts.
 */

import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { forumCategory, forumComment, forumPost, user, type ForumCategory } from "@/db/schema";
import { isPredefinedRole } from "@/types/dashboard.types";
import { getRoleLevel, type Role } from "@/types/role";

// ── Reader ──────────────────────────────────────────────────────────────────

/**
 * What the read path needs to know about the reader. `null` = anonymous.
 * Pages build this from the session (role only — never more).
 */
export type ForumReader = { role: string } | null;

// ── Public projections (exact allow-lists) ──────────────────────────────────

/** Public-safe author fragment: display identity only — never email/role. */
export interface PublicForumAuthor {
  id: string;
  name: string;
  avatar: string | null;
}

/** Category card shape for /forums and the thread/detail breadcrumbs. */
export interface PublicForumCategory {
  id: string;
  /** The unique category name doubles as its URL slug. */
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  /** Count of PUBLISHED threads only — moderation states never inflate it. */
  postCount: number;
  /** Newest PUBLISHED thread's createdAt, or null when the category is empty. */
  lastPostAt: Date | null;
}

/** Thread row shape for /forums/[category]. */
export interface PublicForumThreadSummary {
  id: string;
  title: string;
  type: string;
  createdAt: Date;
  isSticky: boolean;
  isLocked: boolean;
  views: number;
  likeCount: number;
  replyCount: number;
  lastReplyAt: Date | null;
  /** Null only if the author row no longer resolves (e.g. hard-deleted). */
  author: PublicForumAuthor | null;
}

/** Thread detail shape: the summary plus body fields. */
export interface PublicForumThread extends PublicForumThreadSummary {
  content: string;
  tags: string[];
}

/** Comment shape for the thread detail view. */
export interface PublicForumComment {
  id: string;
  content: string;
  createdAt: Date;
  parentId: string | null;
  author: PublicForumAuthor | null;
}

/** Full reading view for /forums/[category]/[post]. */
export interface PublicForumThreadDetail {
  category: PublicForumCategory;
  post: PublicForumThread;
  comments: PublicForumComment[];
}

/** Paginated thread list envelope. */
export interface PublicForumThreadPage {
  items: PublicForumThreadSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Audience gate ───────────────────────────────────────────────────────────

/**
 * Reading gate for one category row. Mirrors enforceCategoryRoleGate's CODE
 * in ./actor.ts (ROLE_HIERARCHY levels, unknown requiredRole -> Infinity so
 * it fails closed) and layers the anonymous/private rules from decision D8.
 */
function canReadCategory(
  category: Pick<ForumCategory, "isActive" | "isPrivate" | "requiredRole">,
  reader: ForumReader,
): boolean {
  if (!category.isActive) return false;

  // Anonymous readers: only categories admins opened (not private, no role
  // gate).
  if (!reader) return !category.isPrivate && !category.requiredRole;

  // Signed-in readers pass the privacy gate; the role gate compares levels.
  if (category.requiredRole) {
    const requiredLevel = isPredefinedRole(category.requiredRole)
      ? getRoleLevel(category.requiredRole)
      : Infinity;
    if (getRoleLevel(reader.role as Role) < requiredLevel) return false;
  }
  return true;
}

// ── Author join (public-news pattern) ───────────────────────────────────────

/**
 * Authors resolve through a left join so a missing/soft-deleted author
 * degrades the byline instead of hiding the content.
 */
const authorJoin = and(eq(forumPost.userId, user.id), isNull(user.deletedAt));
const commentAuthorJoin = and(eq(forumComment.userId, user.id), isNull(user.deletedAt));

function toAuthor(row: {
  author_id: string | null;
  author_name: string | null;
  author_image: string | null;
}): PublicForumAuthor | null {
  if (!row.author_id) return null;
  return { id: row.author_id, name: row.author_name ?? "Member", avatar: row.author_image };
}

// ── Category stats (PUBLISHED posts only) ───────────────────────────────────

interface CategoryStats {
  categoryId: string;
  postCount: number;
  lastPostAt: Date | null;
}

async function categoryStats(categoryIds: string[]): Promise<Map<string, CategoryStats>> {
  const map = new Map<string, CategoryStats>();
  if (categoryIds.length === 0) return map;

  const rows = await db
    .select({
      categoryId: forumPost.categoryId,
      postCount: sql<number>`count(*)::int`.mapWith(Number),
      lastPostAt: sql<Date | null>`max(${forumPost.createdAt})`.mapWith((value) =>
        value ? new Date(value) : null,
      ),
    })
    .from(forumPost)
    .where(and(inArray(forumPost.categoryId, categoryIds), eq(forumPost.status, "PUBLISHED")))
    .groupBy(forumPost.categoryId);

  for (const row of rows) {
    map.set(row.categoryId, row);
  }
  return map;
}

function toCategoryDto(
  category: ForumCategory,
  stats: CategoryStats | undefined,
): PublicForumCategory {
  return {
    id: category.id,
    name: category.name,
    displayName: category.displayName,
    description: category.description,
    icon: category.icon,
    color: category.color,
    postCount: stats?.postCount ?? 0,
    lastPostAt: stats?.lastPostAt ?? null,
  };
}

// ── Read API ────────────────────────────────────────────────────────────────

/**
 * Every category the reader may see, with PUBLISHED-only stats, sorted by
 * the admin-configured order. Empty array when none qualify — pages render
 * an honest empty state rather than fabricated activity.
 */
export async function listPublicForumCategories(
  reader: ForumReader,
): Promise<PublicForumCategory[]> {
  const categories = await db
    .select()
    .from(forumCategory)
    .orderBy(asc(forumCategory.sortOrder), asc(forumCategory.displayName));

  const visible = categories.filter((category) => canReadCategory(category, reader));
  const stats = await categoryStats(visible.map((category) => category.id));
  return visible.map((category) => toCategoryDto(category, stats.get(category.id)));
}

/**
 * One category by slug (the unique `name` column), or null when it does not
 * exist or the reader may not see it. Same gate as the list.
 */
export async function getPublicForumCategory(
  slug: string,
  reader: ForumReader,
): Promise<PublicForumCategory | null> {
  const [category] = await db
    .select()
    .from(forumCategory)
    .where(eq(forumCategory.name, slug))
    .limit(1);
  if (!category || !canReadCategory(category, reader)) return null;

  const stats = await categoryStats([category.id]);
  return toCategoryDto(category, stats.get(category.id));
}

/**
 * PUBLISHED threads of one category, sticky-first then newest-first,
 * paginated. Returns null (never an empty list) when the category does not
 * exist or the reader may not see it, so pages can 404 vs. show an empty
 * state honestly.
 */
export async function listPublicForumThreads(
  slug: string,
  reader: ForumReader,
  options: { page?: number; limit?: number } = {},
): Promise<PublicForumThreadPage | null> {
  const [category] = await db
    .select()
    .from(forumCategory)
    .where(eq(forumCategory.name, slug))
    .limit(1);
  if (!category || !canReadCategory(category, reader)) return null;

  // Pagination clamps: page >= 1, 1 <= limit <= 100.
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const limit = Math.max(1, Math.min(Math.floor(options.limit ?? 20), 100));

  const where = and(eq(forumPost.categoryId, category.id), eq(forumPost.status, "PUBLISHED"));

  const [countRows, rows] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int`.mapWith(Number) })
      .from(forumPost)
      .where(where),
    db
      .select({
        id: forumPost.id,
        title: forumPost.title,
        type: forumPost.type,
        createdAt: forumPost.createdAt,
        isSticky: forumPost.isSticky,
        isLocked: forumPost.isLocked,
        views: forumPost.views,
        likeCount: forumPost.likeCount,
        replyCount: forumPost.replyCount,
        lastReplyAt: forumPost.lastReplyAt,
        author_id: user.id,
        author_name: user.name,
        author_image: user.image,
      })
      .from(forumPost)
      .leftJoin(user, authorJoin)
      .where(where)
      .orderBy(desc(forumPost.isSticky), desc(forumPost.createdAt), desc(forumPost.id))
      .limit(limit)
      .offset((page - 1) * limit),
  ]);

  const total = countRows[0]?.total ?? 0;
  return {
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      createdAt: row.createdAt,
      isSticky: row.isSticky,
      isLocked: row.isLocked,
      views: row.views,
      likeCount: row.likeCount,
      replyCount: row.replyCount,
      lastReplyAt: row.lastReplyAt,
      author: toAuthor(row),
    })),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * One PUBLISHED thread with its category and PUBLISHED comments, or null
 * when any gate fails: unknown slug, invisible category, unknown post,
 * post in a different category, or non-PUBLISHED status. Reading a thread
 * increments its view counter best-effort.
 */
export async function getPublicForumThread(
  slug: string,
  postId: string,
  reader: ForumReader,
): Promise<PublicForumThreadDetail | null> {
  const [category] = await db
    .select()
    .from(forumCategory)
    .where(eq(forumCategory.name, slug))
    .limit(1);
  if (!category || !canReadCategory(category, reader)) return null;

  const [row] = await db
    .select({
      id: forumPost.id,
      title: forumPost.title,
      content: forumPost.content,
      type: forumPost.type,
      createdAt: forumPost.createdAt,
      isSticky: forumPost.isSticky,
      isLocked: forumPost.isLocked,
      views: forumPost.views,
      likeCount: forumPost.likeCount,
      replyCount: forumPost.replyCount,
      lastReplyAt: forumPost.lastReplyAt,
      tags: forumPost.tags,
      author_id: user.id,
      author_name: user.name,
      author_image: user.image,
    })
    .from(forumPost)
    .leftJoin(user, authorJoin)
    .where(
      and(
        eq(forumPost.id, postId),
        eq(forumPost.categoryId, category.id),
        eq(forumPost.status, "PUBLISHED"),
      ),
    )
    .limit(1);
  if (!row) return null;

  const [stats, commentRows] = await Promise.all([
    categoryStats([category.id]),
    db
      .select({
        id: forumComment.id,
        content: forumComment.content,
        createdAt: forumComment.createdAt,
        parentId: forumComment.parentId,
        author_id: user.id,
        author_name: user.name,
        author_image: user.image,
      })
      .from(forumComment)
      .leftJoin(user, commentAuthorJoin)
      .where(and(eq(forumComment.postId, postId), eq(forumComment.status, "PUBLISHED")))
      .orderBy(asc(forumComment.createdAt), asc(forumComment.id)),
  ]);

  // Best-effort view counter: a failure here must never break reading.
  try {
    await db
      .update(forumPost)
      .set({ views: sql`${forumPost.views} + 1` })
      .where(eq(forumPost.id, postId));
  } catch {
    // Views are a display nicety, not part of the reading contract.
  }

  return {
    category: toCategoryDto(category, stats.get(category.id)),
    post: {
      id: row.id,
      title: row.title,
      content: row.content,
      type: row.type,
      createdAt: row.createdAt,
      isSticky: row.isSticky,
      isLocked: row.isLocked,
      views: row.views,
      likeCount: row.likeCount,
      replyCount: row.replyCount,
      lastReplyAt: row.lastReplyAt,
      tags: row.tags,
      author: toAuthor(row),
    },
    comments: commentRows.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      parentId: comment.parentId,
      author: toAuthor(comment),
    })),
  };
}
