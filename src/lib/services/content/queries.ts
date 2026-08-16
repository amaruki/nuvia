import { and, asc, count, desc, eq, getTableColumns, ilike, inArray, ne, or } from "drizzle-orm";

import { db } from "@/db/client";
import { content, contentCategory, user } from "@/db/schema";
import type { ContentListQuery } from "@/lib/validation/content.validation";

import { ContentApiError } from "./errors";
import { rowToItem, selectContentRow } from "./helpers";
import {
  COLLECTION_DB_TYPE,
  UI_STATUS_TO_DB,
  type ContentCollection,
  type ContentRow,
} from "./types";

// ── Public API: content collections ─────────────────────────────────────────

/**
 * Issue #8: `listContent` applies NO status filter unless the caller passes
 * one, so every `content:read` holder (all member tiers) could list drafts
 * and scheduled content. The route layer now resolves a read scope per
 * caller: elevated callers (`content:manage`, `content:publish`, superadmin)
 * keep the full editorial view; everyone else is scoped to PUBLISHED plus
 * items they authored themselves, with author emails (PII) stripped.
 *
 * The author clause keeps the authoring workflow intact for roles that hold
 * `content:create`/`content:update` without `content:publish` (committee
 * chairs, organizers): they can still read back their own drafts.
 */
export interface ContentReadScope {
  /** Elevated callers may see drafts/scheduled/archived. Default false. */
  canSeeUnpublished?: boolean;
  /** Elevated callers may see author emails (PII). Default false. */
  includeAuthorEmail?: boolean;
  /** Non-elevated callers may always see items they authored. */
  authorUserId?: string;
}

/** Rows visible to a non-elevated caller: published, or authored by them. */
function memberStatusVisibility(scope: ContentReadScope) {
  return scope.authorUserId
    ? or(eq(content.status, "PUBLISHED"), eq(content.authorId, scope.authorUserId))!
    : eq(content.status, "PUBLISHED");
}

export async function listContent(
  collection: ContentCollection,
  query: ContentListQuery,
  scope: ContentReadScope = {},
): Promise<{
  items: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  // Issue #25: soft-deleted rows never appear in listings.
  const conditions = [
    eq(content.type, COLLECTION_DB_TYPE[collection]),
    ne(content.status, "DELETED"),
  ];
  if (query.status && query.status.length > 0) {
    const requested = query.status.map((s) => UI_STATUS_TO_DB[s]);
    if (scope.canSeeUnpublished) {
      conditions.push(inArray(content.status, requested));
    } else {
      // Non-elevated callers only ever see the published slice of whatever
      // they asked for, plus their own items (issue #8). Intersect rather
      // than trust the request.
      conditions.push(and(inArray(content.status, requested), memberStatusVisibility(scope))!);
    }
  } else if (!scope.canSeeUnpublished) {
    conditions.push(memberStatusVisibility(scope));
  }
  if (query.search) {
    const needle = `%${query.search}%`;
    conditions.push(or(ilike(content.title, needle), ilike(content.excerpt, needle))!);
  }
  const where = and(...conditions);

  const totalRows = await db.select({ value: count() }).from(content).where(where);
  const total = totalRows[0]?.value ?? 0;

  const sortColumn =
    query.sortBy === "title"
      ? content.title
      : query.sortBy === "updatedAt"
        ? content.updatedAt
        : query.sortBy === "publishedAt"
          ? content.publishedAt
          : content.createdAt;
  const order = query.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  const rows = await db
    .select({
      ...getTableColumns(content),
      category_name: contentCategory.name,
      author_name: user.name,
      author_email: user.email,
      author_image: user.image,
      author_profile_photo: user.profilePhoto,
      author_role: user.role,
    })
    .from(content)
    .leftJoin(contentCategory, eq(content.categoryId, contentCategory.id))
    .leftJoin(user, eq(content.authorId, user.id))
    .where(where)
    .orderBy(order)
    .limit(query.limit)
    .offset((query.page - 1) * query.limit);

  return {
    items: rows.map((row) =>
      rowToItem(row as ContentRow, collection, {
        includeAuthorEmail: scope.includeAuthorEmail,
      }),
    ),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getContentItem(
  collection: ContentCollection,
  id: string,
  scope: ContentReadScope = {},
): Promise<Record<string, unknown>> {
  const row = await selectContentRow(id);
  if (!row || row.type !== COLLECTION_DB_TYPE[collection]) throw ContentApiError.notFound();
  // Issue #25: soft-deleted rows are invisible to every read path.
  if (row.status === "DELETED") throw ContentApiError.notFound();
  // Issue #8: non-elevated callers cannot fetch unpublished content by id,
  // except items they authored themselves. 404 (not 403) so a probe does not
  // reveal that someone else's draft exists.
  const isOwn = scope.authorUserId !== undefined && row.authorId === scope.authorUserId;
  if (!scope.canSeeUnpublished && row.status !== "PUBLISHED" && !isOwn) {
    throw ContentApiError.notFound();
  }
  return rowToItem(row, collection, { includeAuthorEmail: scope.includeAuthorEmail });
}
