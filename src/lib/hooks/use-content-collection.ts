"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { apiFetch, ApiClientError } from "@/lib/api-client";
import { logger } from "@/lib/logger";

/**
 * Shared react-query backbone for the articles / publications / announcements
 * hooks. Every collection lives in the same `content` table server-side and
 * exposes an identical REST surface, so only hydration and naming differ.
 */

export type RawContentItem = Record<string, unknown> & { id: string };

export interface ContentCollectionApi<TItem> {
  /** All loaded items (before client-side filtering/pagination). */
  allItems: TItem[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  getItem: (id: string) => TItem | null;
  createItem: (payload: Record<string, unknown>) => Promise<TItem>;
  updateItem: (id: string, payload: Record<string, unknown>) => Promise<TItem>;
  deleteItem: (id: string) => Promise<void>;
}

/** Serialize form data for JSON transport: drop undefined values and Files. */
export function formToPayload(form: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(form)) {
    if (value === undefined) continue;
    if (typeof File !== "undefined" && value instanceof File) continue;
    if (typeof Blob !== "undefined" && value instanceof Blob) continue;
    if (
      Array.isArray(value) &&
      value.some(
        (v) =>
          (typeof File !== "undefined" && v instanceof File) ||
          (typeof Blob !== "undefined" && v instanceof Blob),
      )
    ) {
      // Binary attachments travel through the media pipeline, not JSON CRUD.
      payload[key] = [];
      continue;
    }
    payload[key] = value;
  }
  return payload;
}

export function useContentCollectionApi<TItem>(
  collection: "articles" | "publications" | "announcements",
  hydrate: (raw: RawContentItem) => TItem,
): ContentCollectionApi<TItem> {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["content", collection], [collection]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const envelope = await apiFetch<RawContentItem[]>(
        `/api/v1/content/${collection}?page=1&limit=100`,
      );
      return envelope.data;
    },
    retry: 1,
  });

  const allItems = useMemo(() => (data ?? []).map(hydrate), [data, hydrate]);

  const refreshData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const getItem = useCallback(
    (id: string): TItem | null =>
      allItems.find((item) => (item as { id?: string }).id === id) ?? null,
    [allItems],
  );

  const createItem = useCallback(
    async (payload: Record<string, unknown>): Promise<TItem> => {
      try {
        const envelope = await apiFetch<RawContentItem>(`/api/v1/content/${collection}`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        await queryClient.invalidateQueries({ queryKey });
        return hydrate(envelope.data);
      } catch (err) {
        logger.error(`Failed to create ${collection} item`, err);
        throw err;
      }
    },
    [collection, hydrate, queryClient, queryKey],
  );

  const updateItem = useCallback(
    async (id: string, payload: Record<string, unknown>): Promise<TItem> => {
      try {
        const envelope = await apiFetch<RawContentItem>(`/api/v1/content/${collection}/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        await queryClient.invalidateQueries({ queryKey });
        return hydrate(envelope.data);
      } catch (err) {
        logger.error(`Failed to update ${collection} item`, err);
        throw err;
      }
    },
    [collection, hydrate, queryClient, queryKey],
  );

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      try {
        await apiFetch<{ deleted: boolean }>(`/api/v1/content/${collection}/${id}`, {
          method: "DELETE",
        });
        await queryClient.invalidateQueries({ queryKey });
      } catch (err) {
        logger.error(`Failed to delete ${collection} item`, err);
        throw err;
      }
    },
    [collection, queryClient, queryKey],
  );

  return {
    allItems,
    loading: isLoading || isFetching,
    error:
      error instanceof ApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : null,
    refreshData,
    getItem,
    createItem,
    updateItem,
    deleteItem,
  };
}

/** Parse ISO date strings returned by the API back into Date objects. */
export function hydrateDate(value: unknown): Date | undefined {
  if (value == null) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}
