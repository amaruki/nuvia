"use client";

/**
 * Categories dashboard hook backed by the real categories API.
 *
 * - The list reads /api/v1/content/categories once; filtering, sorting and
 *   pagination happen client-side over the hydrated rows because the
 *   endpoint exposes no filter params.
 * - Mutations POST / PATCH / DELETE and invalidate the shared list cache.
 * - Statistics are computed client-side from the fetched rows — never
 *   invented.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { CategoryFilters, CategoryStatistics } from "@/types/category.types";

import { applyCategoryFilters } from "./category-filters";
import { CATEGORIES_QUERY_KEY, DEFAULT_FILTERS } from "./constants";
import { buildCategoryStatistics } from "./category-statistics";
import { useCategoriesQuery } from "./use-categories-query";
import { useCategoryMutations } from "./use-category-mutations";
import { useCategoryUtilities } from "./use-category-utilities";

export function useCategories() {
  const queryClient = useQueryClient();
  const [statistics, setStatistics] = useState<CategoryStatistics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CategoryFilters>(DEFAULT_FILTERS);
  const [mutating, setMutating] = useState(false);

  const { data: categories = [], isLoading, refetch } = useCategoriesQuery();

  // Filter and sort categories
  const filteredCategories = useMemo(
    () => applyCategoryFilters(categories, filters),
    [categories, filters],
  );

  useEffect(() => {
    setStatistics(categories.length > 0 ? buildCategoryStatistics(categories) : null);
  }, [categories]);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
  }, [queryClient]);

  // CRUD + bulk operations
  const { createCategory, updateCategory, deleteCategory, bulkDelete, bulkUpdateStatus } =
    useCategoryMutations({ invalidate, setError, setMutating });

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
  const { exportCategories } = useCategoryUtilities({ filteredCategories, setError });

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
