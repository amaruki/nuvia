import type { CategoryFilters } from "@/types/category.types";

/** Base route for the categories API; item routes append `/${id}`. */
export const CATEGORIES_API_PATH = "/api/v1/content/categories";

/** Page size the dashboard requests from the categories list endpoint. */
export const CATEGORIES_PAGE_LIMIT = 200;

/** React Query key shared by the categories list query and its invalidations. */
export const CATEGORIES_QUERY_KEY = ["content", "categories"];

export const DEFAULT_FILTERS: CategoryFilters = {
  sortBy: "order",
  sortOrder: "asc",
  page: 1,
  limit: 20,
};
