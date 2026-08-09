"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

export interface DataTableUrlState {
  sorting: SortingState;
  globalFilter: string;
  columnFilters: ColumnFiltersState;
  page: number;
  pageSize: number;
}

interface UseDataTableStateOptions {
  defaultPageSize?: number;
  /**
   * Column ids that get their own URL param for faceted filters,
   * e.g. { status: "status", chapter: "chapter" } serializes to
   * ?status=ACTIVE,PENDING.
   */
  filterParams?: Record<string, string>;
}

/**
 * Table state synced to URL search params (plan UI-09 item A): sort, global
 * filter, faceted column filters, page, and page size survive navigation and
 * can be shared or bookmarked. Sorting serializes as ?sort=joinedAt.desc, the
 * global filter as ?q=text, pagination as ?page=2&perPage=20. Every setter
 * except setPage resets the page to 1, matching server-driven pagination.
 */
export function useDataTableState(options: UseDataTableStateOptions = {}): {
  state: DataTableUrlState;
  setSorting: (sorting: SortingState) => void;
  setGlobalFilter: (value: string) => void;
  setColumnFilter: (columnId: string, values: string[]) => void;
  setColumnFilters: (filters: ColumnFiltersState) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
} {
  const { defaultPageSize = 10, filterParams = {} } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo<DataTableUrlState>(() => {
    const sortParam = searchParams.get("sort");
    const sorting: SortingState = sortParam
      ? sortParam
          .split(",")
          .map((part) => {
            const [id, direction] = part.split(".");
            return { id, desc: direction === "desc" };
          })
          .filter((entry) => entry.id.length > 0)
      : [];
    const columnFilters: ColumnFiltersState = Object.entries(filterParams).flatMap(
      ([columnId, param]) => {
        const value = searchParams.get(param);
        return value ? [{ id: columnId, value: value.split(",") }] : [];
      },
    );
    const pageSize = Number(searchParams.get("perPage")) || defaultPageSize;
    const page = Number(searchParams.get("page")) || 1;
    return {
      sorting,
      globalFilter: searchParams.get("q") ?? "",
      columnFilters,
      page,
      pageSize,
    };
  }, [searchParams, defaultPageSize, filterParams]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>, resetPage: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      if (resetPage) {
        params.delete("page");
      }
      const query = params.toString();
      const target = query ? `${pathname}?${query}` : pathname;
      router.replace(target, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setSorting = useCallback(
    (sorting: SortingState) => {
      const serialized = sorting.map((entry) => `${entry.id}.${entry.desc ? "desc" : "asc"}`);
      updateParams({ sort: serialized.length > 0 ? serialized.join(",") : null }, true);
    },
    [updateParams],
  );

  const setGlobalFilter = useCallback(
    (value: string) => {
      updateParams({ q: value || null }, true);
    },
    [updateParams],
  );

  const setColumnFilter = useCallback(
    (columnId: string, values: string[]) => {
      const param = filterParams[columnId] ?? columnId;
      updateParams({ [param]: values.length > 0 ? values.join(",") : null }, true);
    },
    [updateParams, filterParams],
  );

  const setColumnFilters = useCallback(
    (filters: ColumnFiltersState) => {
      const updates: Record<string, string | null> = {};
      for (const param of Object.values(filterParams)) {
        updates[param] = null;
      }
      for (const filter of filters) {
        const param = filterParams[filter.id];
        if (param && Array.isArray(filter.value) && filter.value.length > 0) {
          updates[param] = filter.value.join(",");
        }
      }
      updateParams(updates, true);
    },
    [updateParams, filterParams],
  );

  const setPage = useCallback(
    (page: number) => {
      updateParams({ page: page > 1 ? String(page) : null }, false);
    },
    [updateParams],
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      updateParams({ perPage: String(pageSize) }, true);
    },
    [updateParams],
  );

  return {
    state,
    setSorting,
    setGlobalFilter,
    setColumnFilter,
    setColumnFilters,
    setPage,
    setPageSize,
  };
}
