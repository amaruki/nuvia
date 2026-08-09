"use client";

/**
 * Award Nominations — server-paginated DataTable (UI-09 Tier B) backed by
 * GET /api/v1/awards/nominations (backlog D4). Status facet filter and
 * search render from the fetched page — nothing is mocked, and the silent
 * 100-row cap is gone.
 */

import { useCallback, useEffect, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Award, Inbox } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useHeader } from "@/contexts/dashboard-context";
import {
  DataTable,
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableSearch,
  useDataTableState,
} from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAwardNominations } from "@/lib/hooks/use-awards";
import type {
  AwardNomination,
  AwardNominationFilterOptions,
  AwardNominationStatus,
} from "@/types/award.types";

const STATUS_BADGE_VARIANTS: Record<
  AwardNominationStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "secondary",
  under_review: "outline",
  approved: "default",
  rejected: "destructive",
};

const STATUS_OPTIONS: { value: AwardNominationStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function formatEnumLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/^\w/, (char) => char.toUpperCase());
}

const nominationColumns: ColumnDef<AwardNomination>[] = [
  {
    id: "nominee",
    accessorFn: (row) => row.nomineeName,
    header: "Nominee",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="max-w-xs">
        <div className="font-medium">{row.original.nomineeName}</div>
        <div className="truncate text-sm text-muted-foreground">{row.original.nomineeEmail}</div>
      </div>
    ),
  },
  {
    accessorKey: "programName",
    header: "Program",
    enableSorting: false,
    cell: ({ row }) => row.original.programName || "—",
  },
  {
    id: "nominator",
    accessorFn: (row) => row.nominatorName,
    header: "Nominator",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="max-w-xs">
        <div>{row.original.nominatorName}</div>
        <div className="truncate text-sm text-muted-foreground">{row.original.nominatorEmail}</div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => (
      <Badge variant={STATUS_BADGE_VARIANTS[row.original.status]}>
        {formatEnumLabel(row.original.status)}
      </Badge>
    ),
  },
  {
    id: "submitted",
    accessorFn: (row) => row.createdAt.getTime(),
    header: "Submitted",
    enableSorting: false,
    cell: ({ row }) => (
      <span
        className="text-sm text-muted-foreground"
        title={format(row.original.createdAt, "PPP p")}
      >
        {formatDistanceToNow(row.original.createdAt, { addSuffix: true })}
      </span>
    ),
  },
];

export default function AwardNominations() {
  const { setHeader, clearHeader } = useHeader();
  const { state, setGlobalFilter, setColumnFilters, setPage, setPageSize } = useDataTableState({
    filterParams: { status: "status" },
  });

  useEffect(() => {
    setHeader({
      title: "Award Nominations",
      description: "Review nominations submitted against award programs",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const filters = useMemo<AwardNominationFilterOptions>(() => {
    const statusValue = state.columnFilters.find((filter) => filter.id === "status")?.value as
      | string[]
      | undefined;
    return {
      status:
        statusValue && statusValue.length > 0
          ? (statusValue as AwardNominationStatus[])
          : undefined,
      search: state.globalFilter.trim() || undefined,
    };
  }, [state.columnFilters, state.globalFilter]);

  const { nominations, statistics, total, totalPages, loading, isFetching, error, refreshData } =
    useAwardNominations(filters, state.page, state.pageSize);

  const safePage = Math.min(state.page, totalPages);

  // Facet counts reflect the loaded page in manual mode.
  const facetCounts = useCallback(
    (columnId: string) => {
      const counts = new Map<string, number>();
      if (columnId !== "status") return counts;
      for (const nomination of nominations) {
        counts.set(nomination.status, (counts.get(nomination.status) ?? 0) + 1);
      }
      return counts;
    },
    [nominations],
  );

  return (
    <div className="space-y-6">
      {/* Review queue summary (computed from the fetched page) */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="flex items-center gap-2 font-medium">
              <Award className="h-4 w-4 text-primary" />
              {statistics.totalNominations} nomination
              {statistics.totalNominations === 1 ? "" : "s"} (this page)
            </span>
            <span className="text-muted-foreground">{statistics.pending} pending</span>
            <span className="text-muted-foreground">{statistics.underReview} under review</span>
            <span className="text-emerald-700 dark:text-emerald-400">
              {statistics.approved} approved
            </span>
            <span className="text-rose-700 dark:text-rose-400">{statistics.rejected} rejected</span>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={nominationColumns}
        data={nominations}
        loading={loading}
        error={error}
        onRetry={refreshData}
        caption="Award nominations"
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
        getRowId={(nomination) => nomination.id}
        emptyTitle="No nominations yet"
        emptyDescription="Nominations created through the awards API will appear here."
        emptyIcon={<Inbox className="h-10 w-10 text-muted-foreground" />}
        toolbar={(table) => (
          <>
            <DataTableSearch
              value={state.globalFilter}
              onValueChange={setGlobalFilter}
              placeholder="Search by nominee or nominator..."
            />
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={STATUS_OPTIONS.map((option) => ({
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
