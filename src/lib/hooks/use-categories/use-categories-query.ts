"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

import { CATEGORIES_MAX_PAGES, CATEGORIES_QUERY_KEY } from "./constants";
import { hydrateCategory } from "./hydrate-category";
import type { RawCategory } from "./types";
import { categoriesQueryPath } from "./use-category-utilities";

/**
 * Categories list for the dashboard: hydrates every row so filtering,
 * sorting and pagination can happen client-side. The endpoint caps `limit`
 * at 100 (categoryListQuerySchema), so one request cannot carry the whole
 * list; walk pages at that cap until the server reports no more.
 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const rows: RawCategory[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const envelope = await apiFetch<RawCategory[]>(categoriesQueryPath(page));
        rows.push(...envelope.data);
        totalPages = envelope.meta?.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages && page <= CATEGORIES_MAX_PAGES);
      return rows.map(hydrateCategory);
    },
  });
}
