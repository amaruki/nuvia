"use client";

/**
 * Award Programs — server-paginated DataTable (UI-09 Tier B) backed by
 * GET /api/v1/awards/programs (backlog D4). Stats cards, status/category
 * facet filters and search all render from the fetched page — nothing is
 * mocked, and the silent 100-row cap is gone.
 */

import { useCallback, useEffect, useMemo } from "react";
import { Trophy } from "lucide-react";
import { useHeader } from "@/contexts/dashboard-context";
import {
  DataTable,
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableSearch,
  useDataTableState,
} from "@/components/data-table";
import { useAwardPrograms } from "@/lib/hooks/use-awards";
import type {
  AwardCategory,
  AwardProgramFilterOptions,
  AwardProgramStatus,
} from "@/types/award.types";
import { ProgramStatsCards } from "./_components/program-stats-cards";
import { programColumns } from "./_components/program-table";
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from "./_components/program-utils";

export default function AwardPrograms() {
  const { setHeader, clearHeader } = useHeader();
  const { state, setGlobalFilter, setColumnFilters, setPage, setPageSize } = useDataTableState({
    filterParams: { status: "status", category: "category" },
  });

  useEffect(() => {
    setHeader({
      title: "Award Programs",
      description: "Manage award programs, nomination windows, and categories",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const filters = useMemo<AwardProgramFilterOptions>(() => {
    const statusValue = state.columnFilters.find((filter) => filter.id === "status")?.value as
      | string[]
      | undefined;
    const categoryValue = state.columnFilters.find((filter) => filter.id === "category")?.value as
      | string[]
      | undefined;
    return {
      status:
        statusValue && statusValue.length > 0 ? (statusValue as AwardProgramStatus[]) : undefined,
      category:
        categoryValue && categoryValue.length > 0 ? (categoryValue as AwardCategory[]) : undefined,
      search: state.globalFilter.trim() || undefined,
    };
  }, [state.columnFilters, state.globalFilter]);

  const { programs, statistics, total, totalPages, loading, isFetching, error, refreshData } =
    useAwardPrograms(filters, state.page, state.pageSize);

  const safePage = Math.min(state.page, totalPages);

  // Facet counts reflect the loaded page in manual mode.
  const facetCounts = useCallback(
    (columnId: string) => {
      const counts = new Map<string, number>();
      for (const program of programs) {
        const value = columnId === "status" ? program.status : program.category;
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
      return counts;
    },
    [programs],
  );

  return (
    <div className="space-y-6">
      <ProgramStatsCards statistics={statistics} />

      <DataTable
        columns={programColumns}
        data={programs}
        loading={loading}
        error={error}
        onRetry={refreshData}
        caption="Award programs"
        manualSorting
        manualFiltering
        globalFilter={state.globalFilter}
        onGlobalFilterChange={(updater) =>
          setGlobalFilter(typeof updater === "function" ? updater(state.globalFilter) : updater)
        }
        columnFilters={state.columnFilters}
        onColumnFiltersChange={(updater) =>
          setColumnFilters(typeof updater === "function" ? updater(state.columnFilters) : updater)
        }
        getFacetedUniqueValues={facetCounts}
        getRowId={(program) => program.id}
        emptyTitle="No award programs yet"
        emptyDescription="Award programs created through the awards API will appear here."
        emptyIcon={<Trophy className="h-10 w-10 text-muted-foreground" />}
        toolbar={(table) => (
          <>
            <DataTableSearch
              value={state.globalFilter}
              onValueChange={setGlobalFilter}
              placeholder="Search programs..."
            />
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={STATUS_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
            <DataTableFacetedFilter
              column={table.getColumn("category")}
              title="Category"
              options={CATEGORY_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </>
        )}
        pagination={
          <DataTablePagination
            page={safePage}
            pageCount={totalPages}
            total={total}
            pageSize={state.pageSize}
            loading={isFetching}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      />
    </div>
  );
}
