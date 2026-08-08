"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

import { CATEGORIES_QUERY_KEY } from "./constants";
import { hydrateCategory } from "./hydrate-category";
import type { RawCategory } from "./types";
import { categoriesQueryPath } from "./use-category-utilities";

/**
 * Categories list for the dashboard: fetches one page of the API and hydrates
 * the wire rows; filtering, sorting and pagination happen client-side, so the
 * query itself takes no filters.
 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const envelope = await apiFetch<RawCategory[]>(categoriesQueryPath());
      return envelope.data.map(hydrateCategory);
    },
  });
}
