import type { Category, CategoryFilters } from "@/types/category.types";

/**
 * Client-side filtering and sorting of the hydrated categories list: the
 * categories endpoint serves one big page and has no filter params, so the
 * dashboard applies the active filters and sort order in memory.
 */
export function applyCategoryFilters(categories: Category[], filters: CategoryFilters): Category[] {
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
      (cat) => cat.createdAt >= filters.dateRange!.start && cat.createdAt <= filters.dateRange!.end,
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
}
