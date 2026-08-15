import type { CategoryFilters } from "@/types/category.types";

/** Base route for the categories API; item routes append `/${id}`. */
export const CATEGORIES_API_PATH = "/api/v1/content/categories";

/**
 * Page size for the categories list endpoint. The API caps `limit` at 100
 * (categoryListQuerySchema); the dashboard query loops pages to hydrate
 * the full list for client-side filtering.
 */
export const CATEGORIES_PAGE_LIMIT = 100;

/**
 * Hard stop on the hydration loop so a malformed `totalPages` (for example
 * a huge or non-finite value) cannot drive unbounded requests. 100 pages at
 * the limit cap is far beyond any realistic category count.
 */
export const CATEGORIES_MAX_PAGES = 100;

/** React Query key shared by the categories list query and its invalidations. */
export const CATEGORIES_QUERY_KEY = ["content", "categories"];

export const DEFAULT_FILTERS: CategoryFilters = {
  sortBy: "order",
  sortOrder: "asc",
  page: 1,
  limit: 20,
};
