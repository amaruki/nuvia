import { and, asc, count, eq, max, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { forumCategory, forumPost } from "@/db/schema";
import { problems } from "@/lib/http";
import type { ForumActor } from "./actor";
import { ForumServiceError } from "./errors";
import { createCategorySchema, updateCategorySchema } from "./schemas";
import type { CategoryDto } from "./types";

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

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
