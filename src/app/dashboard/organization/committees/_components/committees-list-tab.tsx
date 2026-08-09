/**
 * Committees list tab — DataTable layer (UI-09 C3).
 *
 * Self-contained server-side paginated table over GET /api/v1/committees
 * (no silent 100-row cap). Faceted status/type filters and search go
 * straight to the API; write actions are owned by the page and their
 * mutations invalidate the shared ["committees"] query prefix.
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Award, TrendingDown, TrendingUp } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DataTable,
  DataTableDensityToggle,
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableSearch,
  useDataTableState,
  type DataTableDensity,
} from "@/components/data-table";
import { apiFetch } from "@/lib/api-client";
import { COMMITTEES_API_PATH, COMMITTEES_QUERY_KEY } from "@/lib/hooks/use-committees/constants";
import { toCommitteeUi, type WireCommittee } from "@/lib/hooks/use-committees";
import { cn } from "@/lib/utils";
import type { Committee } from "@/types/committee";
import { CommitteeActionsMenu } from "@/components/committees/committees-table/committee-actions-menu";
import {
  CommitteeAuthorityBadge,
  CommitteeStatusBadge,
  CommitteeTypeBadge,
} from "@/components/committees/committees-table/committee-badges";
import {
  getStatusIcon,
  getStatusIconColor,
} from "@/components/committees/committees-table/helpers";

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Pending", value: "pending" },
  { label: "Suspended", value: "suspended" },
];

const TYPE_OPTIONS = [
  { label: "Executive", value: "executive" },
  { label: "Functional", value: "functional" },
  { label: "Special interest", value: "special_interest" },
  { label: "Ad hoc", value: "ad_hoc" },
  { label: "Standing", value: "standing" },
];

interface CommitteesListTabProps {
  onViewDetails: (committee: Committee) => void;
  onEdit: (committee: Committee) => void;
  onDelete: (committee: Committee) => void;
  onToggleStatus: (committee: Committee, status: "active" | "inactive") => void;
}

export function CommitteesListTab({
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: CommitteesListTabProps) {
  const { state, setGlobalFilter, setColumnFilters, setPage, setPageSize } = useDataTableState({
    defaultPageSize: 20,
    filterParams: { status: "status", type: "type" },
  });
  const [density, setDensity] = useState<DataTableDensity>("comfortable");
  const [togglingCommittee, setTogglingCommittee] = useState<string | null>(null);

  const statusFilter = useMemo(
    () => (state.columnFilters.find((filter) => filter.id === "status")?.value as string[]) ?? [],
    [state.columnFilters],
  );
  const typeFilter = useMemo(
    () => (state.columnFilters.find((filter) => filter.id === "type")?.value as string[]) ?? [],
    [state.columnFilters],
  );

  const { data, isFetching, isError, error, refetch } = useQuery({
    // Under the shared ["committees"] prefix so the page's mutation
    // invalidations refresh this table automatically.
    queryKey: [
      ...COMMITTEES_QUERY_KEY,
      "list",
      state.page,
      state.pageSize,
      state.globalFilter,
      statusFilter,
      typeFilter,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(state.page));
      params.set("limit", String(state.pageSize));
      if (state.globalFilter.trim()) params.set("search", state.globalFilter.trim());
      if (statusFilter.length > 0) params.set("status", statusFilter.join(","));
      if (typeFilter.length > 0) params.set("type", typeFilter.join(","));
      return apiFetch<WireCommittee[]>(`${COMMITTEES_API_PATH}?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    select: (envelope) => ({
      committees: (envelope.data ?? []).map(toCommitteeUi),
      meta: envelope.meta,
    }),
  });

  const committees = data?.committees ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  // Facet counts in manual mode come from the loaded page rows.
  const facetCounts = useCallback(
    (columnId: string) => {
      const counts = new Map<string, number>();
      for (const committee of committees) {
        const value = columnId === "type" ? committee.type : committee.status || undefined;
        if (value) {
          counts.set(value, (counts.get(value) ?? 0) + 1);
        }
      }
      return counts;
    },
    [committees],
  );

  const handleToggleStatus = useCallback(
    async (committee: Committee, status: "active" | "inactive") => {
      setTogglingCommittee(committee.id);
      try {
        await onToggleStatus(committee, status);
      } finally {
        setTogglingCommittee(null);
      }
    },
    [onToggleStatus],
  );

  const columns = useMemo<ColumnDef<Committee>[]>(
    () => [
      {
        id: "name",
        accessorFn: (committee) => committee.displayName,
        header: "Committee",
        enableSorting: false,
        cell: ({ row }) => {
          const committee = row.original;
          const StatusIcon = getStatusIcon(committee.status);
          return (
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <StatusIcon className={cn("h-4 w-4", getStatusIconColor(committee.status))} />
              </div>
              <div>
                <div className="font-medium">{committee.displayName}</div>
                <div className="text-sm text-muted-foreground">
                  Created {formatDistanceToNow(committee.createdAt, { addSuffix: true })}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "type",
        accessorFn: (committee) => committee.type,
        header: "Type",
        enableSorting: false,
        cell: ({ row }) => {
          const committee = row.original;
          return (
            <div className="flex items-center gap-2">
              <CommitteeTypeBadge type={committee.type} />
              <div className="text-xs text-muted-foreground">
                <CommitteeAuthorityBadge authority={committee.charter.authorityLevel} />
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorFn: (committee) => committee.status,
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <CommitteeStatusBadge status={row.original.status} />,
      },
      {
        id: "members",
        header: "Members",
        enableSorting: false,
        cell: ({ row }) => {
          const metrics = row.original.metrics;
          return (
            <div>
              <div className="font-medium">{metrics.memberCount}</div>
              <div className="text-sm text-muted-foreground">
                {metrics.activeMembersCount} active
              </div>
            </div>
          );
        },
      },
      {
        id: "attendance",
        header: "Attendance",
        enableSorting: false,
        cell: ({ row }) => {
          const rate = row.original.metrics.meetingAttendanceRate;
          const positive = rate - 80 >= 0;
          return (
            <span
              className={cn(
                "font-medium",
                positive
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-700 dark:text-rose-400",
              )}
            >
              {rate.toFixed(1)}%
            </span>
          );
        },
      },
      {
        id: "goals",
        header: "Goals",
        enableSorting: false,
        cell: ({ row }) => {
          const rate = row.original.metrics.goalCompletionRate;
          const positive = rate - 75 >= 0;
          const GoalIcon = positive ? TrendingUp : TrendingDown;
          return (
            <div className="flex items-center space-x-2">
              <GoalIcon
                className={cn("h-4 w-4", positive ? "text-emerald-500" : "text-rose-500")}
              />
              <span
                className={cn(
                  "font-medium",
                  positive
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-rose-700 dark:text-rose-400",
                )}
              >
                {rate.toFixed(1)}%
              </span>
            </div>
          );
        },
      },
      {
        id: "deliverables",
        header: "Deliverables",
        enableSorting: false,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.metrics.deliverablesCount}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        ),
      },
      {
        id: "impact",
        header: "Impact",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-amber-500" />
            <span className="font-medium">{row.original.metrics.impactScore.toFixed(1)}</span>
          </div>
        ),
      },
      {
        id: "leadership",
        header: "Leadership",
        enableSorting: false,
        cell: ({ row }) => {
          const committee = row.original;
          return (
            <div className="flex items-center space-x-1">
              {committee.leadership.slice(0, 3).map((leader) => (
                <Avatar key={leader.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={leader.avatar} alt={leader.name} />
                  <AvatarFallback className="text-xs">
                    {leader.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
              {committee.leadership.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  +{committee.leadership.length - 3}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <CommitteeActionsMenu
            committee={row.original}
            isToggling={togglingCommittee === row.original.id}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={handleToggleStatus}
          />
        ),
      },
    ],
    [togglingCommittee, onViewDetails, onEdit, onDelete, handleToggleStatus],
  );

  return (
    <TabsContent value="committees" className="space-y-6">
      <DataTable
        columns={columns}
        data={committees}
        loading={isFetching && !data}
        error={
          isError ? (error instanceof Error ? error.message : "Failed to load committees") : null
        }
        onRetry={() => void refetch()}
        caption="Committees"
        getRowId={(committee) => committee.id}
        manualFiltering
        columnFilters={state.columnFilters}
        onColumnFiltersChange={(updater) =>
          setColumnFilters(typeof updater === "function" ? updater(state.columnFilters) : updater)
        }
        getFacetedUniqueValues={facetCounts}
        onRowClick={onViewDetails}
        density={density}
        emptyTitle="No committees found"
        emptyDescription="Try a different search, or clear the status and type filters."
        toolbar={(table) => (
          <>
            <DataTableSearch
              value={state.globalFilter}
              onValueChange={setGlobalFilter}
              placeholder="Search committees..."
            />
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={STATUS_OPTIONS}
            />
            <DataTableFacetedFilter
              column={table.getColumn("type")}
              title="Type"
              options={TYPE_OPTIONS}
            />
            <DataTableDensityToggle density={density} onDensityChange={setDensity} />
          </>
        )}
        pagination={
          <DataTablePagination
            page={state.page}
            pageCount={totalPages}
            total={total}
            pageSize={state.pageSize}
            loading={isFetching}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      />
    </TabsContent>
  );
}
