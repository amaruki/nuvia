import type { PublicationFilters } from "@/types/publication";

export function hasActiveFilters(filters: PublicationFilters): boolean {
  return !!(
    filters.search ||
    (filters.status && filters.status.length > 0) ||
    (filters.type && filters.type.length > 0) ||
    (filters.category && filters.category.length > 0) ||
    (filters.author && filters.author.length > 0) ||
    (filters.tags && filters.tags.length > 0) ||
    filters.dateRange ||
    (filters.visibility && filters.visibility.length > 0) ||
    filters.featured !== undefined
  );
}

export function getActiveFilterCount(filters: PublicationFilters): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.status && filters.status.length > 0) count++;
  if (filters.type && filters.type.length > 0) count++;
  if (filters.category && filters.category.length > 0) count++;
  if (filters.author && filters.author.length > 0) count++;
  if (filters.tags && filters.tags.length > 0) count++;
  if (filters.dateRange) count++;
  if (filters.visibility && filters.visibility.length > 0) count++;
  if (filters.featured !== undefined) count++;
  return count;
}
