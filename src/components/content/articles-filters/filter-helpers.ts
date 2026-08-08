import type { ArticleFilters } from "@/types/article.types";

export function hasActiveFilters(filters: ArticleFilters): boolean {
  return !!(
    filters.search ||
    (filters.status && filters.status.length > 0) ||
    (filters.type && filters.type.length > 0) ||
    (filters.category && filters.category.length > 0) ||
    (filters.difficulty && filters.difficulty.length > 0) ||
    (filters.format && filters.format.length > 0) ||
    (filters.author && filters.author.length > 0) ||
    (filters.tags && filters.tags.length > 0) ||
    filters.dateRange ||
    (filters.visibility && filters.visibility.length > 0) ||
    filters.featured !== undefined ||
    filters.hasSeries !== undefined ||
    filters.minReadTime !== undefined ||
    filters.maxReadTime !== undefined ||
    filters.minEngagement !== undefined ||
    filters.maxEngagement !== undefined
  );
}

export function getActiveFilterCount(filters: ArticleFilters): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.status && filters.status.length > 0) count++;
  if (filters.type && filters.type.length > 0) count++;
  if (filters.category && filters.category.length > 0) count++;
  if (filters.difficulty && filters.difficulty.length > 0) count++;
  if (filters.format && filters.format.length > 0) count++;
  if (filters.author && filters.author.length > 0) count++;
  if (filters.tags && filters.tags.length > 0) count++;
  if (filters.dateRange) count++;
  if (filters.visibility && filters.visibility.length > 0) count++;
  if (filters.featured !== undefined) count++;
  if (filters.hasSeries !== undefined) count++;
  if (filters.minReadTime !== undefined) count++;
  if (filters.maxReadTime !== undefined) count++;
  if (filters.minEngagement !== undefined) count++;
  if (filters.maxEngagement !== undefined) count++;
  return count;
}
