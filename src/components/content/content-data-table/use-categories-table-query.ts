"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiFetch } from "@/lib/api-client";
import type { DataTableUrlState } from "@/hooks/use-data-table-state";
import { hydrateCategory } from "@/lib/hooks/use-categories/hydrate-category";
import type { RawCategory } from "@/lib/hooks/use-categories/types";
import type { Category } from "@/types/category.types";

import type { ContentTableMeta } from "./types";

export interface CategoriesTableQuery {
  rows: Category[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Server-driven data source for the categories table. The list endpoint
 * accepts page/limit/search (no sortBy contract), so sorting stays
 * client-side while search and pagination go to the server.
 */
export function useCategoriesTableQuery({
  state,
  version = 0,
  enabled = true,
}: {
  state: DataTableUrlState;
  version?: number;
  enabled?: boolean;
}): CategoriesTableQuery {
  const [rows, setRows] = useState<Category[]>([]);
  const [meta, setMeta] = useState<ContentTableMeta>({
    page: 1,
    limit: state.pageSize,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const requestIdRef = useRef(0);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(state.page));
    params.set("limit", String(state.pageSize));
    const query = state.globalFilter.trim();
    if (query) params.set("search", query);
    return `/api/v1/content/categories?${params.toString()}`;
  }, [state.page, state.pageSize, state.globalFilter]);

  useEffect(() => {
    if (!enabled) return;
    const requestId = ++requestIdRef.current;
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<RawCategory[]>(url)
      .then((envelope) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        setRows((envelope.data ?? []).map(hydrateCategory));
        setMeta({
          page: envelope.meta?.page ?? state.page,
          limit: envelope.meta?.limit ?? state.pageSize,
          total: envelope.meta?.total ?? 0,
          totalPages: envelope.meta?.totalPages ?? 1,
        });
        setLoading(false);
      })
      .catch((fetchError: unknown) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load categories");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled, version, nonce]);

  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  return { rows, total: meta.total, totalPages: meta.totalPages, loading, error, refetch };
}
