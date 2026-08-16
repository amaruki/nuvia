import { and, asc, count, eq, ilike, ne } from "drizzle-orm";

import { db } from "@/db/client";
import { content, contentCategory } from "@/db/schema";
import type {
  CategoryListQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/validation/content.validation";

import { ContentApiError, pgErrorCode } from "./errors";
import { slugify } from "./helpers";

// ── Public API: categories ──────────────────────────────────────────────────

type CategoryRow = typeof contentCategory.$inferSelect;

interface CategoryUi {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  scope: string;
  status: "active" | "inactive" | "archived";
  color?: string;
  icon?: string;
  emoji?: string;
  order: number;
  parentId?: string;
  contentCount: number;
  allowedRoles: string[];
  allowedChapters: string[];
  allowedCommittees: string[];
  createdBy: string;
  lastModifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

function categoryRowToUi(row: CategoryRow, contentCount: number): CategoryUi {
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  const status =
    (metadata.status as CategoryUi["status"] | undefined) ?? (row.isActive ? "active" : "inactive");
  return {
    id: row.id,
    name: row.name,
    slug: (metadata.slug as string | undefined) ?? slugify(row.name),
    description: row.description ?? "",
    type: (metadata.type as string | undefined) ?? "article",
    scope: (metadata.scope as string | undefined) ?? "global",
    status,
    color: row.color ?? undefined,
    icon: row.icon ?? undefined,
    emoji: metadata.emoji as string | undefined,
    order: row.sortOrder ?? 0,
    parentId: row.parentId ?? undefined,
    contentCount,
    allowedRoles: (metadata.allowedRoles as string[] | undefined) ?? [],
    allowedChapters: (metadata.allowedChapters as string[] | undefined) ?? [],
    allowedCommittees: (metadata.allowedCommittees as string[] | undefined) ?? [],
    createdBy: (metadata.createdBy as string | undefined) ?? row.id,
    lastModifiedBy: metadata.lastModifiedBy as string | undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function categoryContentCounts(): Promise<Map<string, number>> {
  const rows = await db
    .select({ categoryId: content.categoryId, value: count() })
    .from(content)
    // Issue #25: soft-deleted rows no longer count toward category totals.
    .where(ne(content.status, "DELETED"))
    .groupBy(content.categoryId);
  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.categoryId) map.set(row.categoryId, row.value);
  }
  return map;
}

export async function listCategories(query: CategoryListQuery): Promise<{
  items: CategoryUi[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const where = query.search ? ilike(contentCategory.name, `%${query.search}%`) : undefined;

  const totalRows = await db.select({ value: count() }).from(contentCategory).where(where);
  const total = totalRows[0]?.value ?? 0;

  const rows = await db
    .select()
    .from(contentCategory)
    .where(where)
    .orderBy(asc(contentCategory.sortOrder), asc(contentCategory.name))
    .limit(query.limit)
    .offset((query.page - 1) * query.limit);

  const counts = await categoryContentCounts();
  return {
    items: rows.map((row) => categoryRowToUi(row, counts.get(row.id) ?? 0)),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getCategoryItem(id: string): Promise<CategoryUi> {
  const rows = await db.select().from(contentCategory).where(eq(contentCategory.id, id)).limit(1);
  const row = rows[0];
  if (!row) throw ContentApiError.notFound("Category");
  // A single-category read must not pay for the whole-table GROUP BY that
  // categoryContentCounts() performs; mirror that aggregation exactly
  // (excluding soft-deleted rows, issue #25) so single-item and list views
  // agree.
  const countRows = await db
    .select({ value: count() })
    .from(content)
    .where(and(eq(content.categoryId, id), ne(content.status, "DELETED")));
  return categoryRowToUi(row, countRows[0]?.value ?? 0);
}

export async function createCategoryItem(
  input: CreateCategoryInput,
  actorId: string,
): Promise<CategoryUi> {
  const now = new Date();
  const isActive =
    (input.status ?? "active") !== "archived" && (input.status ?? "active") !== "inactive";
  const metadata: Record<string, unknown> = {
    slug: input.slug ?? slugify(input.name),
    type: input.type,
    scope: input.scope,
    status: input.status,
    emoji: input.emoji,
    allowedRoles: input.allowedRoles,
    allowedChapters: input.allowedChapters,
    allowedCommittees: input.allowedCommittees,
    createdBy: actorId,
  };

  try {
    await db.insert(contentCategory).values({
      name: input.name.trim(),
      displayName: input.name.trim(),
      description: input.description ?? null,
      icon: input.icon ?? null,
      color: input.color ?? null,
      parentId: input.parentId ?? null,
      sortOrder: input.order ?? 0,
      isActive,
      metadata,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      throw ContentApiError.conflict(`Category "${input.name}" already exists`);
    }
    throw error;
  }

  const rows = await db
    .select()
    .from(contentCategory)
    .where(eq(contentCategory.name, input.name.trim()))
    .limit(1);
  const created = rows[0];
  if (!created) throw ContentApiError.internal();
  return categoryRowToUi(created, 0);
}

export async function updateCategoryItem(
  id: string,
  input: UpdateCategoryInput,
  actorId: string,
): Promise<CategoryUi> {
  const rows = await db.select().from(contentCategory).where(eq(contentCategory.id, id)).limit(1);
  const existing = rows[0];
  if (!existing) throw ContentApiError.notFound("Category");

  const metadata = (existing.metadata ?? {}) as Record<string, unknown>;
  const nextName = input.name?.trim() ?? existing.name;

  if (input.slug !== undefined) metadata.slug = input.slug;
  if (input.type !== undefined) metadata.type = input.type;
  if (input.scope !== undefined) metadata.scope = input.scope;
  if (input.status !== undefined) metadata.status = input.status;
  if (input.emoji !== undefined) metadata.emoji = input.emoji;
  if (input.allowedRoles !== undefined) metadata.allowedRoles = input.allowedRoles;
  if (input.allowedChapters !== undefined) metadata.allowedChapters = input.allowedChapters;
  if (input.allowedCommittees !== undefined) metadata.allowedCommittees = input.allowedCommittees;
  metadata.lastModifiedBy = actorId;

  const isActive = input.status !== undefined ? input.status === "active" : existing.isActive;

  try {
    await db
      .update(contentCategory)
      .set({
        name: nextName,
        displayName: nextName,
        description: input.description !== undefined ? input.description : existing.description,
        icon: input.icon !== undefined ? input.icon : existing.icon,
        color: input.color !== undefined ? input.color : existing.color,
        parentId: input.parentId !== undefined ? input.parentId : existing.parentId,
        sortOrder: input.order ?? existing.sortOrder,
        isActive,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(contentCategory.id, id));
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      throw ContentApiError.conflict(`Category "${nextName}" already exists`);
    }
    throw error;
  }

  return getCategoryItem(id);
}

export async function deleteCategoryItem(id: string): Promise<void> {
  const rows = await db
    .select({ id: contentCategory.id })
    .from(contentCategory)
    .where(eq(contentCategory.id, id))
    .limit(1);
  if (rows.length === 0) throw ContentApiError.notFound("Category");
  try {
    // Issue #25: content deletion is now soft, so live content still holds
    // FK references to this category. Rows already soft-deleted carry no
    // live references worth protecting — drop them so the category can go;
    // categories with live content still fail the FK check below (409).
    await db.delete(content).where(and(eq(content.categoryId, id), eq(content.status, "DELETED")));
    await db.delete(contentCategory).where(eq(contentCategory.id, id));
  } catch (error) {
    if (pgErrorCode(error) === "23503") {
      throw ContentApiError.conflict("Category is in use by content items and cannot be deleted");
    }
    throw error;
  }
}
