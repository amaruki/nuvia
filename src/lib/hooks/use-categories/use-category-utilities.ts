"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { Category } from "@/types/category.types";

import { logger } from "@/lib/logger";

import { CATEGORIES_API_PATH, CATEGORIES_PAGE_LIMIT } from "./constants";
import { toErrorMessage } from "./error-message";

/** Builds the /api/v1/content/categories list URL the dashboard fetches. */
export function categoriesQueryPath(): string {
  return `${CATEGORIES_API_PATH}?page=1&limit=${CATEGORIES_PAGE_LIMIT}`;
}

/** Flattens hydrated categories into the serializable JSON export payload. */
export function buildCategoryExportRows(categories: Category[]) {
  return categories.map((cat) => ({
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
}

interface UseCategoryUtilitiesDeps {
  filteredCategories: Category[];
  setError: Dispatch<SetStateAction<string | null>>;
}

export function useCategoryUtilities({ filteredCategories, setError }: UseCategoryUtilitiesDeps) {
  // Export/Import
  const exportCategories = useCallback(
    async (format: "json" | "csv") => {
      try {
        const data = buildCategoryExportRows(filteredCategories);

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
    [filteredCategories, setError],
  );

  return { exportCategories };
}
