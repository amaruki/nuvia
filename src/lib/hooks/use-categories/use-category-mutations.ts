"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { Category, CategoryFormData, CategoryStatus } from "@/types/category.types";

import { apiFetch } from "@/lib/api-client";

import { CATEGORIES_API_PATH } from "./constants";
import { toErrorMessage } from "./error-message";
import { hydrateCategory } from "./hydrate-category";
import type { RawCategory } from "./types";

interface UseCategoryMutationsDeps {
  invalidate: () => Promise<void>;
  setError: Dispatch<SetStateAction<string | null>>;
  setMutating: Dispatch<SetStateAction<boolean>>;
}

export function useCategoryMutations({
  invalidate,
  setError,
  setMutating,
}: UseCategoryMutationsDeps) {
  // Create category
  const createCategory = useCallback(
    async (data: CategoryFormData): Promise<Category> => {
      setMutating(true);
      setError(null);
      try {
        const envelope = await apiFetch<RawCategory>(CATEGORIES_API_PATH, {
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
    [invalidate, setError, setMutating],
  );

  // Update category
  const updateCategory = useCallback(
    async (id: string, data: Partial<CategoryFormData>): Promise<void> => {
      setMutating(true);
      setError(null);
      try {
        await apiFetch<RawCategory>(`${CATEGORIES_API_PATH}/${id}`, {
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
    [invalidate, setError, setMutating],
  );

  // Delete category
  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      setMutating(true);
      setError(null);
      try {
        await apiFetch<null>(`${CATEGORIES_API_PATH}/${id}`, { method: "DELETE" });
        await invalidate();
      } catch (err) {
        const message = toErrorMessage(err, "Failed to delete category");
        setError(message);
        throw new Error(message);
      } finally {
        setMutating(false);
      }
    },
    [invalidate, setError, setMutating],
  );

  // Bulk operations
  const bulkDelete = useCallback(
    async (ids: string[]): Promise<void> => {
      setMutating(true);
      setError(null);
      try {
        await Promise.all(
          ids.map((id) => apiFetch<null>(`${CATEGORIES_API_PATH}/${id}`, { method: "DELETE" })),
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
    [invalidate, setError, setMutating],
  );

  const bulkUpdateStatus = useCallback(
    async (ids: string[], status: CategoryStatus): Promise<void> => {
      setMutating(true);
      setError(null);
      try {
        await Promise.all(
          ids.map((id) =>
            apiFetch<RawCategory>(`${CATEGORIES_API_PATH}/${id}`, {
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
    [invalidate, setError, setMutating],
  );

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    bulkDelete,
    bulkUpdateStatus,
  };
}
