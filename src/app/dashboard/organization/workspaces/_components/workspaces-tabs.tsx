"use client";

import { useCallback, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
import { WORKSPACES_API_PATH } from "@/lib/hooks/use-workspaces/constants";
import { toWorkspaceUi, type WireWorkspace } from "@/lib/hooks/use-workspaces";
import { cn } from "@/lib/utils";
import type { CommitteeWorkspace } from "@/types/committee";
import { WorkspaceActionsMenu } from "@/components/workspaces/workspaces-table/workspace-actions-menu";
import {
  WorkspaceStatusBadge,
  WorkspaceTypeBadge,
} from "@/components/workspaces/workspaces-table/workspace-badges";
import {
  formatFileSize,
  getStatusIcon,
  getStatusIconColor,
} from "@/components/workspaces/workspaces-table/helpers";

import { ActivityTab } from "./activity-tab";
import { DocumentsTab } from "./documents-tab";
import { OverviewTab } from "./overview-tab";
import { TasksTab } from "./tasks-tab";

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Archived", value: "archived" },
  { label: "Locked", value: "locked" },
];

const TYPE_OPTIONS = [
  { label: "General", value: "general" },
  { label: "Project", value: "project" },
  { label: "Document", value: "document" },
  { label: "Discussion", value: "discussion" },
  { label: "Meeting", value: "meeting" },
];

interface WorkspacesTabsProps {
  workspaces: CommitteeWorkspace[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onViewDetails: (workspace: CommitteeWorkspace) => void;
  onEdit: (workspace: CommitteeWorkspace) => void;
  onDelete: (workspace: CommitteeWorkspace) => void;
  onToggleStatus: (workspace: CommitteeWorkspace, status: "active" | "archived") => void;
}

export function WorkspacesTabs({
  workspaces,
  activeTab,
  onTabChange,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: WorkspacesTabsProps) {
  const { state, setGlobalFilter, setColumnFilters, setPage, setPageSize } = useDataTableState({
    defaultPageSize: 20,
    filterParams: { status: "status", type: "type" },
  });
  const [density, setDensity] = useState<DataTableDensity>("comfortable");
  const [togglingWorkspace, setTogglingWorkspace] = useState<string | null>(null);

  const statusFilter = useMemo(
    () => (state.columnFilters.find((filter) => filter.id === "status")?.value as string[]) ?? [],
    [state.columnFilters],
  );
  const typeFilter = useMemo(
    () => (state.columnFilters.find((filter) => filter.id === "type")?.value as string[]) ?? [],
    [state.columnFilters],
  );

  const { data, isFetching, isError, error, refetch } = useQuery({
    // Under the shared ["workspaces"] prefix so the page's mutation
    // invalidations refresh this table automatically.
    queryKey: [
      "workspaces",
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
      return apiFetch<WireWorkspace[]>(`${WORKSPACES_API_PATH}?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    select: (envelope) => ({
      workspaces: (envelope.data ?? []).map(toWorkspaceUi),
      meta: envelope.meta,
    }),
  });

  const rows = data?.workspaces ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  // Facet counts in manual mode come from the loaded page rows.
  const facetCounts = useCallback(
    (columnId: string) => {
      const counts = new Map<string, number>();
      for (const workspace of rows) {
        const value = columnId === "type" ? workspace.type : workspace.status || undefined;
        if (value) {
          counts.set(value, (counts.get(value) ?? 0) + 1);
        }
      }
      return counts;
    },
    [rows],
  );

  const handleToggleStatus = useCallback(
    async (workspace: CommitteeWorkspace, status: "active" | "archived") => {
      setTogglingWorkspace(workspace.id);
      try {
        await onToggleStatus(workspace, status);
      } finally {
        setTogglingWorkspace(null);
      }
    },
    [onToggleStatus],
  );

  const columns = useMemo<ColumnDef<CommitteeWorkspace>[]>(
    () => [
      {
        id: "name",
        accessorFn: (workspace) => workspace.name,
        header: "Workspace",
        enableSorting: false,
        cell: ({ row }) => {
          const workspace = row.original;
          const StatusIcon = getStatusIcon(workspace.status);
          return (
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <StatusIcon className={cn("h-4 w-4", getStatusIconColor(workspace.status))} />
              </div>
              <div>
                <div className="font-medium">{workspace.name}</div>
                <div className="text-sm text-muted-foreground">
                  Created {formatDistanceToNow(workspace.createdAt, { addSuffix: true })}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "type",
        accessorFn: (workspace) => workspace.type,
        header: "Type",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <WorkspaceTypeBadge type={row.original.type} />
            <div className="text-xs text-muted-foreground">
              {row.original.settings.isPublic ? "Public" : "Private"}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        accessorFn: (workspace) => workspace.status,
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <WorkspaceStatusBadge status={row.original.status} />,
      },
      {
        id: "members",
        header: "Members",
        enableSorting: false,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.members.length}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.members.filter((m) => m.isActive).length} active
            </div>
          </div>
        ),
      },
      {
        id: "documents",
        header: "Documents",
        enableSorting: false,
        cell: ({ row }) => {
          const documents = row.original.documents;
          return (
            <div>
              <div className="font-medium">{documents.length}</div>
              <div className="text-sm text-muted-foreground">
                {documents.length > 0
                  ? formatFileSize(documents.reduce((sum, doc) => sum + doc.fileSize, 0))
                  : "0 Bytes"}
              </div>
            </div>
          );
        },
      },
      {
        id: "tasks",
        header: "Tasks",
        enableSorting: false,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.tasks.length}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.tasks.filter((t) => t.status === "completed").length} completed
            </div>
          </div>
        ),
      },
      {
        id: "discussions",
        header: "Discussions",
        enableSorting: false,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.discussions.length}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.discussions.reduce((sum, d) => sum + d.replyCount, 0)} replies
            </div>
          </div>
        ),
      },
      {
        id: "meetings",
        header: "Meetings",
        enableSorting: false,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.meetings.length}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.meetings.filter((m) => m.status === "completed").length} completed
            </div>
          </div>
        ),
      },
      {
        id: "activity",
        header: "Activity",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-amber-500" />
            <span className="font-medium">{row.original.activity.length}</span>
            <span className="text-xs text-muted-foreground">activities</span>
          </div>
        ),
      },
      {
        id: "team",
        header: "Team",
        enableSorting: false,
        cell: ({ row }) => {
          const members = row.original.members;
          return (
            <div className="flex items-center space-x-1">
              {members.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="text-xs">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  +{members.length - 3}
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
          <WorkspaceActionsMenu
            workspace={row.original}
            isToggling={togglingWorkspace === row.original.id}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={handleToggleStatus}
          />
        ),
      },
    ],
    [togglingWorkspace, onViewDetails, onEdit, onDelete, handleToggleStatus],
  );

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
        <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
          Overview
        </TabsTrigger>
        <TabsTrigger value="workspaces" className="text-xs sm:text-sm py-2 px-2">
          Workspaces
        </TabsTrigger>
        <TabsTrigger value="documents" className="text-xs sm:text-sm py-2 px-2">
          Documents
        </TabsTrigger>
        <TabsTrigger value="tasks" className="text-xs sm:text-sm py-2 px-2">
          Tasks
        </TabsTrigger>
        <TabsTrigger value="activity" className="text-xs sm:text-sm py-2 px-2">
          Activity
        </TabsTrigger>
      </TabsList>

      <OverviewTab workspaces={workspaces} />

      <TabsContent value="workspaces" className="space-y-6">
        <DataTable
          columns={columns}
          data={rows}
          loading={isFetching && !data}
          error={
            isError ? (error instanceof Error ? error.message : "Failed to load workspaces") : null
          }
          onRetry={() => void refetch()}
          caption="Workspaces"
          getRowId={(workspace) => workspace.id}
          manualFiltering
          columnFilters={state.columnFilters}
          onColumnFiltersChange={(updater) =>
            setColumnFilters(typeof updater === "function" ? updater(state.columnFilters) : updater)
          }
          getFacetedUniqueValues={facetCounts}
          onRowClick={onViewDetails}
          density={density}
          emptyTitle="No workspaces found"
          emptyDescription="Try a different search, or clear the status and type filters."
          toolbar={(table) => (
            <>
              <DataTableSearch
                value={state.globalFilter}
                onValueChange={setGlobalFilter}
                placeholder="Search workspaces..."
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

      <DocumentsTab workspaces={workspaces} />

      <TasksTab workspaces={workspaces} />

      <ActivityTab workspaces={workspaces} />
    </Tabs>
  );
}
