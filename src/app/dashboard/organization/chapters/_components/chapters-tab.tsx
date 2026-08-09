/**
 * Chapters list tab — DataTable layer (UI-09 C3).
 *
 * Self-contained server-side paginated table over GET /api/v1/chapters
 * (no silent 100-row cap). Faceted status/region filters and search are
 * passed straight to the API; mutation handlers stay owned by the page.
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { MapPin, MoreHorizontal, TrendingDown, TrendingUp } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableDensityToggle,
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableSearch,
  useDataTableState,
  type DataTableDensity,
} from "@/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/lib/api-client";
import { CHAPTERS_API_PATH } from "@/lib/hooks/use-chapters/constants";
import { cn } from "@/lib/utils";
import type { Chapter } from "@/types/chapter.types";
import { ChapterStatusBadge, FinancialHealthBadge } from "./chapter-badges";
import { formatCurrency, getStatusIcon, getStatusIconColor } from "./helpers";

interface ChapterActionsMenuProps {
  chapter: Chapter;
  isToggling: boolean;
  onViewDetails: (chapter: Chapter) => void;
  onEdit: (chapter: Chapter) => void;
  onDelete: (chapter: Chapter) => void;
  onToggleStatus: (chapter: Chapter, status: "active" | "inactive") => void;
}

export function ChapterActionsMenu({
  chapter,
  isToggling,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: ChapterActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          aria-label={`Actions for ${chapter.displayName}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(chapter)}>View Details</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(chapter)}>Edit</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={chapter.contactInfo.website} target="_blank" rel="noopener noreferrer">
            Visit Website
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            onToggleStatus(chapter, chapter.status === "active" ? "inactive" : "active")
          }
          disabled={isToggling}
        >
          {chapter.status === "active" ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(chapter)}
          className="text-destructive focus:text-destructive"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Pending", value: "pending" },
  { label: "Suspended", value: "suspended" },
];

interface ChaptersTabProps {
  isToggling: boolean;
  onViewDetails: (chapter: Chapter) => void;
  onEdit: (chapter: Chapter) => void;
  onDelete: (chapter: Chapter) => void;
  onToggleStatus: (chapter: Chapter, status: "active" | "inactive") => void;
}

export function ChaptersTab({
  isToggling,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: ChaptersTabProps) {
  const { state, setGlobalFilter, setColumnFilters, setPage, setPageSize } = useDataTableState({
    defaultPageSize: 20,
    filterParams: { status: "status", region: "region" },
  });
  const [density, setDensity] = useState<DataTableDensity>("comfortable");

  const statusFilter = useMemo(
    () => (state.columnFilters.find((filter) => filter.id === "status")?.value as string[]) ?? [],
    [state.columnFilters],
  );
  const regionFilter = useMemo(
    () => (state.columnFilters.find((filter) => filter.id === "region")?.value as string[]) ?? [],
    [state.columnFilters],
  );

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: [
      "chapters",
      "list",
      state.page,
      state.pageSize,
      state.globalFilter,
      statusFilter,
      regionFilter,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(state.page));
      params.set("limit", String(state.pageSize));
      if (state.globalFilter.trim()) params.set("search", state.globalFilter.trim());
      for (const status of statusFilter) params.append("status", status);
      for (const region of regionFilter) params.append("region", region);
      return apiFetch<Chapter[]>(`${CHAPTERS_API_PATH}?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  const chapters = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  // Region values are dynamic; facet options come from the loaded rows.
  const regionOptions = useMemo(() => {
    const regions = new Set(chapters.map((chapter) => chapter.location.region));
    return Array.from(regions)
      .filter(Boolean)
      .sort()
      .map((region) => ({ label: region, value: region }));
  }, [chapters]);

  // Facet counts in manual mode come from the loaded page rows.
  const facetCounts = useCallback(
    (columnId: string) => {
      const counts = new Map<string, number>();
      for (const chapter of chapters) {
        const value = columnId === "region" ? chapter.location.region : chapter.status || undefined;
        if (value) {
          counts.set(value, (counts.get(value) ?? 0) + 1);
        }
      }
      return counts;
    },
    [chapters],
  );

  const columns = useMemo<ColumnDef<Chapter>[]>(
    () => [
      {
        id: "name",
        accessorFn: (chapter) => chapter.displayName,
        header: "Chapter",
        enableSorting: false,
        cell: ({ row }) => {
          const chapter = row.original;
          const StatusIcon = getStatusIcon(chapter.status);
          return (
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <StatusIcon className={cn("h-4 w-4", getStatusIconColor(chapter.status))} />
              </div>
              <div>
                <div className="font-medium">{chapter.displayName}</div>
                <div className="text-sm text-muted-foreground">
                  Established {formatDistanceToNow(chapter.establishedDate, { addSuffix: true })}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "location",
        header: "Location",
        enableSorting: false,
        cell: ({ row }) => {
          const chapter = row.original;
          return (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {chapter.location.city}, {chapter.location.state}
                </div>
                <div className="text-sm text-muted-foreground">
                  {chapter.location.region} • {chapter.location.country}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorFn: (chapter) => chapter.status,
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <ChapterStatusBadge status={row.original.status} />,
      },
      {
        id: "members",
        header: "Members",
        enableSorting: false,
        cell: ({ row }) => {
          const chapter = row.original;
          return (
            <div>
              <div className="font-medium">{chapter.memberCount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">
                {chapter.metrics.activeMembersThisMonth} active this month
              </div>
            </div>
          );
        },
      },
      {
        id: "growth",
        header: "Growth",
        enableSorting: false,
        cell: ({ row }) => {
          const growth = row.original.metrics.memberGrowthRate;
          const GrowthIcon = growth >= 0 ? TrendingUp : TrendingDown;
          return (
            <div className="flex items-center space-x-2">
              <GrowthIcon
                className={cn("h-4 w-4", growth >= 0 ? "text-emerald-500" : "text-rose-500")}
              />
              <span
                className={`font-medium ${growth >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
              >
                {growth.toFixed(1)}%
              </span>
            </div>
          );
        },
      },
      {
        id: "events",
        header: "Events",
        enableSorting: false,
        cell: ({ row }) => {
          const chapter = row.original;
          return (
            <div>
              <div className="font-medium">{chapter.events.length}</div>
              <div className="text-sm text-muted-foreground">
                {chapter.metrics.eventAttendanceRate.toFixed(1)}% attendance
              </div>
            </div>
          );
        },
      },
      {
        id: "revenue",
        header: "Revenue",
        enableSorting: false,
        cell: ({ row }) => {
          const chapter = row.original;
          return (
            <div>
              <div className="font-medium">{formatCurrency(chapter.finances.totalRevenue)}</div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(chapter.finances.netIncome)} net
              </div>
            </div>
          );
        },
      },
      {
        id: "financialHealth",
        header: "Financial Health",
        enableSorting: false,
        cell: ({ row }) => <FinancialHealthBadge health={row.original.metrics.financialHealth} />,
      },
      {
        id: "region",
        accessorFn: (chapter) => chapter.location.region,
        header: "Region",
        enableSorting: false,
        cell: ({ row }) => row.original.location.region,
      },
      {
        id: "team",
        header: "Team",
        enableSorting: false,
        cell: ({ row }) => {
          const chapter = row.original;
          return (
            <div className="flex items-center space-x-1">
              {chapter.leadership.slice(0, 3).map((leader) => (
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
              {chapter.leadership.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  +{chapter.leadership.length - 3}
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
          <ChapterActionsMenu
            chapter={row.original}
            isToggling={isToggling}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
          />
        ),
      },
    ],
    [isToggling, onViewDetails, onEdit, onDelete, onToggleStatus],
  );

  return (
    <DataTable
      columns={columns}
      data={chapters}
      loading={isFetching && !data}
      error={isError ? (error instanceof Error ? error.message : "Failed to load chapters") : null}
      onRetry={() => void refetch()}
      caption="Chapters"
      getRowId={(chapter) => chapter.id}
      manualFiltering
      columnFilters={state.columnFilters}
      onColumnFiltersChange={(updater) =>
        setColumnFilters(typeof updater === "function" ? updater(state.columnFilters) : updater)
      }
      getFacetedUniqueValues={facetCounts}
      onRowClick={onViewDetails}
      density={density}
      emptyTitle="No chapters found"
      emptyDescription="Try a different search, or clear the status and region filters."
      toolbar={(table) => (
        <>
          <DataTableSearch
            value={state.globalFilter}
            onValueChange={setGlobalFilter}
            placeholder="Search chapters..."
          />
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={STATUS_OPTIONS}
          />
          <DataTableFacetedFilter
            column={table.getColumn("region")}
            title="Region"
            options={regionOptions}
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
  );
}
