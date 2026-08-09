/**
 * UI-26 — Public /news read path (ring 0).
 *
 * Modeled on src/lib/services/job/public-board.ts, the repo's existing
 * public read path. These pages run unauthenticated (server components under
 * `src/app/(public)/news/**` call this module directly — never the
 * `content:read`-gated API), so the functions below ARE the security
 * boundary. Safety comes entirely from:
 *
 *   1. the filter — only rows at the audience-ready state from the planning
 *      doc's exposure matrix (status PUBLISHED, visibility PUBLIC,
 *      publishedAt in the past), restricted to the three content types the
 *      backoffice manages as collections (decision D9: one /news feed for
 *      articles, announcements, and publications — the enum has nine types,
 *      the rest must never surface here);
 *   2. the projection — a field allow-list. Never-public fields (author
 *      email, internal status/visibility, the `metadata` blob that carries
 *      backoffice UI payloads, rosters of ids) are not selected at all, so
 *      they cannot leak even by accident.
 */

import { and, count, desc, eq, inArray, isNull, lte, or, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import { content, user } from "@/db/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The three content types managed as backoffice collections
 * (src/lib/services/content/types.ts COLLECTION_DB_TYPE). The `ContentType`
 * enum has more values (BLOG_POST, PAGE, NEWS, …); they are deliberately
 * excluded from the public feed.
 */
export const NEWS_TYPES = ["ARTICLE", "ANNOUNCEMENT", "PUBLICATION"] as const;
export type NewsType = (typeof NEWS_TYPES)[number];

/** Public-safe author fragment: display identity only — never an email. */
export interface PublicNewsAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

/** Card-level shape for the /news list. */
export interface PublicNewsSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  type: NewsType;
  /** Guaranteed non-null by the `publishedAt <= now` filter. */
  publishedAt: Date;
  /** Null only if the author row no longer resolves (e.g. hard-deleted). */
  author: PublicNewsAuthor | null;
}

/** Reading-view shape for /news/[id-or-slug]: the list shape plus the body. */
export interface PublicNewsItem extends PublicNewsSummary {
  content: string;
  tags: string[];
  featuredImage: string | null;
}

export interface PublicNewsFilters {
  type?: NewsType;
  page?: number;
  limit?: number;
}

export interface PaginatedNews {
  items: PublicNewsSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/** Same clamp semantics as the job board's paginate helper. */
function paginate(page?: number, limit?: number): { page: number; limit: number; offset: number } {
  // Math.trunc(NaN) is NaN, so non-finite inputs (e.g. a bad ?page= query
  // param) fall back to the defaults instead of poisoning LIMIT/OFFSET.
  const safePage =
    typeof page === "number" && Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
  const safeLimit =
    typeof limit === "number" && Number.isFinite(limit)
      ? Math.min(100, Math.max(1, Math.trunc(limit)))
      : 20;
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

function publicConditions(type?: NewsType): SQL[] {
  const conditions: SQL[] = [
    inArray(content.type, [...NEWS_TYPES]),
    eq(content.status, "PUBLISHED"),
    eq(content.visibility, "PUBLIC"),
    // NULL never satisfies `<=`, so rows without a publish date stay hidden.
    lte(content.publishedAt, new Date()),
  ];
  if (type) {
    conditions.push(eq(content.type, type));
  }
  return conditions;
}

/**
 * Authors resolve through a left join so a missing/deleted author degrades
 * the byline instead of hiding the item. Soft-deleted users are treated as
 * gone: their profiles are no longer audience-ready.
 */
const authorJoin = and(eq(content.authorId, user.id), isNull(user.deletedAt));

function toAuthor(row: {
  author_id: string | null;
  author_name: string | null;
  author_image: string | null;
}): PublicNewsAuthor | null {
  if (!row.author_id) return null;
  return { id: row.author_id, name: row.author_name, image: row.author_image };
}

const listSelect = {
  id: content.id,
  title: content.title,
  slug: content.slug,
  excerpt: content.excerpt,
  type: content.type,
  publishedAt: content.publishedAt,
  author_id: user.id,
  author_name: user.name,
  author_image: user.image,
} as const;

/** Row shape produced by `listSelect` (left-joined author columns nullable). */
interface NewsListRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  type: string;
  publishedAt: Date | null;
  author_id: string | null;
  author_name: string | null;
  author_image: string | null;
}

function toSummary(row: NewsListRow): PublicNewsSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    // The where clause restricts type to NEWS_TYPES and publishedAt to
    // non-null past dates; the narrower types are safe here.
    type: row.type as NewsType,
    publishedAt: row.publishedAt as Date,
    author: toAuthor(row),
  };
}

// ---------------------------------------------------------------------------
// Public read path
// ---------------------------------------------------------------------------

/**
 * Paginated public news feed (newest first). Consumed by /news.
 */
export async function listPublicNews(filters: PublicNewsFilters = {}): Promise<PaginatedNews> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  const where = and(...publicConditions(filters.type));

  const [rows, totalResult] = await Promise.all([
    db
      .select(listSelect)
      .from(content)
      .leftJoin(user, authorJoin)
      .where(where)
      .orderBy(desc(content.publishedAt), desc(content.id))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(content).where(where),
  ]);

  const total = totalResult[0]?.value ?? 0;
  return {
    items: rows.map(toSummary),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * Public reading view by id or slug (the backoffice links /news/<id>, the
 * public cards link /news/<slug>; both resolve here). Returns null for
 * anything not audience-ready — the page renders its not-found state.
 */
export async function getPublicNewsItem(idOrSlug: string): Promise<PublicNewsItem | null> {
  const rows = await db
    .select({
      ...listSelect,
      content: content.content,
      tags: content.tags,
      featuredImage: content.featuredImage,
    })
    .from(content)
    .leftJoin(user, authorJoin)
    .where(and(or(eq(content.id, idOrSlug), eq(content.slug, idOrSlug)), ...publicConditions()))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    ...toSummary(row),
    content: row.content,
    tags: row.tags,
    featuredImage: row.featuredImage,
  };
}
