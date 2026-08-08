import { and, asc, count, desc, eq, getTableColumns, ilike, inArray, or } from "drizzle-orm";

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

export async function listContent(
  collection: ContentCollection,
  query: ContentListQuery,
): Promise<{
  items: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const conditions = [eq(content.type, COLLECTION_DB_TYPE[collection])];
  if (query.status && query.status.length > 0) {
    conditions.push(
      inArray(
        content.status,
        query.status.map((s) => UI_STATUS_TO_DB[s]),
      ),
    );
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
    items: rows.map((row) => rowToItem(row as ContentRow, collection)),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getContentItem(
  collection: ContentCollection,
  id: string,
): Promise<Record<string, unknown>> {
  const row = await selectContentRow(id);
  if (!row || row.type !== COLLECTION_DB_TYPE[collection]) throw ContentApiError.notFound();
  return rowToItem(row, collection);
}
