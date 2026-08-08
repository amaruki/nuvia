"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Category,
  CategoryFilters,
  CategoryFormData,
  CategoryStatistics,
  CategoryStatus,
  CategoryType,
  CategoryScope,
} from "@/types/category.types";
import { CATEGORY_SCOPES, CATEGORY_STATUSES, CATEGORY_TYPES } from "@/types/category.types";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { logger } from "@/lib/logger";

interface RawCategory {
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
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_FILTERS: CategoryFilters = {
  sortBy: "order",
  sortOrder: "asc",
  page: 1,
  limit: 20,
};

const QUERY_KEY = ["content", "categories"];

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function hydrateCategory(raw: RawCategory): Category {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description || undefined,
    type: raw.type as CategoryType,
    status: raw.status,
    scope: raw.scope as CategoryScope,
    color: raw.color ?? "#6366f1",
    icon: raw.icon,
    emoji: raw.emoji,
    parentId: raw.parentId,
    order: raw.order,
    contentCount: raw.contentCount,
    allowedRoles: raw.allowedRoles,
    allowedChapters: raw.allowedChapters,
    allowedCommittees: raw.allowedCommittees,
    createdAt: toDate(raw.createdAt) ?? new Date(),
    updatedAt: toDate(raw.updatedAt) ?? new Date(),
    createdBy: raw.createdBy,
    updatedBy: raw.lastModifiedBy,
  };
}

function buildCategoryStatistics(categories: Category[]): CategoryStatistics {
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

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function useCategories() {
  const queryClient = useQueryClient();
  const [statistics, setStatistics] = useState<CategoryStatistics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CategoryFilters>(DEFAULT_FILTERS);
  const [mutating, setMutating] = useState(false);

  const {
    data: categories = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const envelope = await apiFetch<RawCategory[]>("/api/v1/content/categories?page=1&limit=200");
      return envelope.data.map(hydrateCategory);
    },
  });

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let filtered = [...categories];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchLower) ||
          cat.description?.toLowerCase().includes(searchLower) ||
          cat.slug.toLowerCase().includes(searchLower),
      );
    }

    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter((cat) => filters.type!.includes(cat.type));
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((cat) => filters.status!.includes(cat.status));
    }

    if (filters.scope && filters.scope.length > 0) {
      filtered = filtered.filter((cat) => filters.scope!.includes(cat.scope));
    }

    if (filters.parentId) {
      filtered = filtered.filter((cat) => cat.parentId === filters.parentId);
    }

    if (filters.createdBy && filters.createdBy.length > 0) {
      filtered = filtered.filter((cat) => filters.createdBy!.includes(cat.createdBy));
    }

    if (filters.dateRange) {
      filtered = filtered.filter(
        (cat) =>
          cat.createdAt >= filters.dateRange!.start && cat.createdAt <= filters.dateRange!.end,
      );
    }

    filtered.sort((a, b) => {
      const { sortBy = "order", sortOrder = "asc" } = filters;
      let aValue: unknown = a[sortBy as keyof Category];
      let bValue: unknown = b[sortBy as keyof Category];

      if (sortBy === "name") {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      }

      if (aValue === bValue) return 0;
      if (sortOrder === "asc") {
        return (aValue ?? 0) > (bValue ?? 0) ? 1 : -1;
      }
      return (aValue ?? 0) < (bValue ?? 0) ? 1 : -1;
    });

    return filtered;
  }, [categories, filters]);

  useEffect(() => {
    setStatistics(categories.length > 0 ? buildCategoryStatistics(categories) : null);
  }, [categories]);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  // Create category
  const createCategory = useCallback(
    async (data: CategoryFormData): Promise<Category> => {
      setMutating(true);
      setError(null);
      try {
        const envelope = await apiFetch<RawCategory>("/api/v1/content/categories", {
          method: "POST",
          body: JSON.stringify({ ...data }),
        });
        await invalidate();
        return hydrateCategory(envelope.data);
      } catch (err) {
        const message = toErrorMessage(err, "Failed to create category");
        setError(message);
        throw new Error(message);
      } finally {
        setMutating(false);
      }
    },
    [invalidate],
  );

  // Update category
  const updateCategory = useCallback(
    async (id: string, data: Partial<CategoryFormData>): Promise<void> => {
      setMutating(true);
      setError(null);
      try {
        await apiFetch<RawCategory>(`/api/v1/content/categories/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ ...data }),
        });
        await invalidate();
      } catch (err) {
        const message = toErrorMessage(err, "Failed to update category");
        setError(message);
        throw new Error(message);
      } finally {
        setMutating(false);
      }
    },
    [invalidate],
  );

  // Delete category
  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      setMutating(true);
      setError(null);
      try {
        await apiFetch<null>(`/api/v1/content/categories/${id}`, { method: "DELETE" });
        await invalidate();
      } catch (err) {
        const message = toErrorMessage(err, "Failed to delete category");
        setError(message);
        throw new Error(message);
      } finally {
        setMutating(false);
      }
    },
    [invalidate],
  );

  // Bulk operations
  const bulkDelete = useCallback(
    async (ids: string[]): Promise<void> => {
      setMutating(true);
      setError(null);
      try {
        await Promise.all(
          ids.map((id) => apiFetch<null>(`/api/v1/content/categories/${id}`, { method: "DELETE" })),
        );
        await invalidate();
      } catch (err) {
        const message = toErrorMessage(err, "Failed to delete categories");
        setError(message);
        throw new Error(message);
      } finally {
        setMutating(false);
      }
    },
    [invalidate],
  );

  const bulkUpdateStatus = useCallback(
    async (ids: string[], status: CategoryStatus): Promise<void> => {
      setMutating(true);
      setError(null);
      try {
        await Promise.all(
          ids.map((id) =>
            apiFetch<RawCategory>(`/api/v1/content/categories/${id}`, {
              method: "PATCH",
              body: JSON.stringify({ status }),
            }),
          ),
        );
        await invalidate();
      } catch (err) {
        const message = toErrorMessage(err, "Failed to update categories");
        setError(message);
        throw new Error(message);
      } finally {
        setMutating(false);
      }
    },
    [invalidate],
  );

  // Filter operations
  const updateFilters = useCallback((newFilters: Partial<CategoryFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const refreshData = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Export/Import
  const exportCategories = useCallback(
    async (format: "json" | "csv") => {
      try {
        const data = filteredCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          type: cat.type,
          status: cat.status,
          scope: cat.scope,
          color: cat.color,
          icon: cat.icon,
          contentCount: cat.contentCount,
          createdAt: cat.createdAt,
          createdBy: cat.createdBy,
        }));

        if (format === "json") {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `categories-${new Date().toISOString().split("T")[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          // CSV export would be implemented here
          logger.info("CSV export not implemented yet");
        }
      } catch (err) {
        setError(toErrorMessage(err, "Failed to export categories"));
      }
    },
    [filteredCategories],
  );

  return {
    // Data
    categories: filteredCategories,
    statistics,
    loading: isLoading || mutating,
    error,
    filters,

    // CRUD operations
    createCategory,
    updateCategory,
    deleteCategory,
    bulkDelete,
    bulkUpdateStatus,

    // Filter operations
    updateFilters,
    clearFilters,

    // Utility operations
    refreshData,
    exportCategories,

    // Pagination
    currentPage: filters.page || 1,
    totalPages: Math.max(1, Math.ceil(filteredCategories.length / (filters.limit || 20))),
    totalItems: filteredCategories.length,
  };
}
