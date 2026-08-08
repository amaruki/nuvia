import type { Category, CategoryStatistics } from "@/types/category.types";
import { CATEGORY_SCOPES, CATEGORY_STATUSES, CATEGORY_TYPES } from "@/types/category.types";

export function buildCategoryStatistics(categories: Category[]): CategoryStatistics {
  return {
    totalCategories: categories.length,
    activeCategories: categories.filter((c) => c.status === "active").length,
    inactiveCategories: categories.filter((c) => c.status === "inactive").length,
    archivedCategories: categories.filter((c) => c.status === "archived").length,
    categoriesByType: CATEGORY_TYPES.map((type) => {
      const items = categories.filter((c) => c.type === type);
      return {
        type,
        count: items.length,
        contentCount: items.reduce((acc, c) => acc + (c.contentCount ?? 0), 0),
      };
    }),
    categoriesByScope: CATEGORY_SCOPES.map((scope) => ({
      scope,
      count: categories.filter((c) => c.scope === scope).length,
    })),
    categoriesByStatus: CATEGORY_STATUSES.map((status) => ({
      status,
      count: categories.filter((c) => c.status === status).length,
    })),
    mostUsedCategories: categories
      .slice()
      .sort((a, b) => (b.contentCount ?? 0) - (a.contentCount ?? 0))
      .slice(0, 5)
      .map((c) => ({
        categoryId: c.id,
        name: c.name,
        contentCount: c.contentCount ?? 0,
        type: c.type,
        lastUsed: c.lastUsed ?? c.updatedAt,
      })),
    recentlyCreated: categories
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        createdBy: c.createdBy,
        createdAt: c.createdAt,
      })),
    orphanedCategories: categories
      .filter((c) => (c.contentCount ?? 0) === 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        lastUsed: c.lastUsed,
      })),
  };
}
