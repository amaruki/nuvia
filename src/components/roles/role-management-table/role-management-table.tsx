/**
 * Role Management Table (UI-09 C3 DataTable layer)
 *
 * Server-side paginated, sortable, searchable user-role table over
 * GET /api/v1/admin/users. Individual and bulk role changes go through the
 * existing PATCH /api/v1/admin/users/{id}/role and POST
 * /api/v1/admin/users/bulk-role-update endpoints; the list refetches itself
 * afterwards via react-query invalidation.
 */

"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DataTable,
  DataTableBulkBar,
  DataTableColumnHeader,
  DataTableDensityToggle,
  DataTablePagination,
  DataTableSearch,
  useDataTableState,
  type DataTableDensity,
} from "@/components/data-table";
import { apiFetch } from "@/lib/api-client";
import { logger } from "@/lib/logger";
import type { Role, UserWithRoleInfo } from "@/types/role";
import { ROLE_PERMISSIONS } from "@/types/role";

import { BulkRoleChangeDialog, RoleUpdateDialog } from "./role-change-dialogs";
import type { BulkRoleDialogState, RoleManagementTableProps, RoleUpdateDialogState } from "./types";

interface AdminUsersPayload {
  users: UserWithRoleInfo[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const USERS_QUERY_KEY = ["roles", "users"];

const getRoleBadgeVariant = (role: Role): "default" | "secondary" | "destructive" | "outline" => {
  if (role === "superadmin") return "destructive";
  if (role === "admin") return "default";
  if (["staff", "treasurer", "chapter_president"].includes(role)) return "default";
  return "outline";
};

export function RoleManagementTable({ onRoleChange, onBulkRoleChange }: RoleManagementTableProps) {
  const queryClient = useQueryClient();
  const { state, setSorting, setGlobalFilter, setPage, setPageSize } = useDataTableState({
    defaultPageSize: 20,
  });
  const [density, setDensity] = useState<DataTableDensity>("comfortable");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [roleUpdateDialog, setRoleUpdateDialog] = useState<RoleUpdateDialogState>({
    open: false,
  });
  const [bulkRoleDialog, setBulkRoleDialog] = useState<BulkRoleDialogState>({ open: false });
  const [reason, setReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: [...USERS_QUERY_KEY, state.page, state.pageSize, state.globalFilter, state.sorting],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(state.page));
      params.set("limit", String(state.pageSize));
      params.set("includeRoles", "true");
      if (state.globalFilter.trim()) params.set("search", state.globalFilter.trim());
      const sort = state.sorting[0];
      if (sort) {
        params.set("sortBy", sort.id);
        params.set("sortOrder", sort.desc ? "desc" : "asc");
      }
      return apiFetch<AdminUsersPayload>(`/api/v1/admin/users?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  const users = data?.data.users ?? [];
  const pagination = data?.data.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  const refreshUsers = () => {
    void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!onRoleChange) return;
    setIsUpdating(true);
    try {
      await onRoleChange(userId, newRole, reason);
      setRoleUpdateDialog({ open: false });
      setReason("");
      refreshUsers();
    } catch (err) {
      logger.error("Failed to update role", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkRoleChange = async () => {
    if (!onBulkRoleChange || !bulkRoleDialog.newRole || selectedIds.length === 0) return;
    setIsUpdating(true);
    try {
      await onBulkRoleChange(selectedIds, bulkRoleDialog.newRole, reason);
      setBulkRoleDialog({ open: false });
      setRowSelection({});
      setReason("");
      refreshUsers();
    } catch (err) {
      logger.error("Failed to update roles", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const columns = useMemo<ColumnDef<UserWithRoleInfo>[]>(
    () => [
      {
        id: "name",
        accessorFn: (user) => user.displayName || user.name || user.username,
        header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div>
              <div className="font-medium">{user.displayName || user.name || user.username}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          );
        },
      },
      {
        id: "role",
        accessorFn: (user) => user.role,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Current Role" />,
        cell: ({ row }) => (
          <Badge variant={getRoleBadgeVariant(row.original.role)}>{row.original.role}</Badge>
        ),
      },
      {
        id: "permissions",
        header: "Permissions",
        enableSorting: false,
        cell: ({ row }) => {
          const user = row.original;
          const count =
            ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS]?.length ??
            user.permissions.length;
          return <div className="text-sm text-muted-foreground">{count} permissions</div>;
        },
      },
      {
        id: "createdAt",
        accessorFn: (user) => user.createdAt,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Member Since" />,
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {format(new Date(row.original.createdAt), "MMM d, yyyy")}
          </div>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  aria-label={`Actions for ${user.displayName || user.name || user.username}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    setRoleUpdateDialog({
                      open: true,
                      userId: user.id,
                      currentRole: user.role,
                      newRole: user.role,
                    })
                  }
                >
                  <User className="mr-2 h-4 w-4" />
                  Change Role
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <DataTableBulkBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setRowSelection({})}
        actions={
          <Button size="sm" variant="outline" onClick={() => setBulkRoleDialog({ open: true })}>
            <User className="mr-2 h-4 w-4" />
            Change role
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        loading={isFetching && !data}
        error={isError ? (error instanceof Error ? error.message : "Failed to load users") : null}
        onRetry={() => void refetch()}
        caption="User roles"
        getRowId={(user) => user.id}
        manualSorting
        manualFiltering
        sorting={state.sorting}
        onSortingChange={(updater) =>
          setSorting(typeof updater === "function" ? updater(state.sorting) : updater)
        }
        globalFilter={state.globalFilter}
        onGlobalFilterChange={(updater) =>
          setGlobalFilter(typeof updater === "function" ? updater(state.globalFilter) : updater)
        }
        enableSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        density={density}
        emptyTitle="No users found"
        emptyDescription="Try a different search term."
        toolbar={() => (
          <>
            <DataTableSearch
              value={state.globalFilter}
              onValueChange={setGlobalFilter}
              placeholder="Search users..."
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

      {/* Individual Role Change Dialog */}
      <RoleUpdateDialog
        open={roleUpdateDialog.open}
        currentRole={roleUpdateDialog.currentRole}
        newRole={roleUpdateDialog.newRole}
        reason={reason}
        isUpdating={isUpdating}
        onOpenChange={(open) => setRoleUpdateDialog({ ...roleUpdateDialog, open })}
        onNewRoleChange={(newRole) => setRoleUpdateDialog({ ...roleUpdateDialog, newRole })}
        onReasonChange={setReason}
        onCancel={() => setRoleUpdateDialog({ open: false })}
        onSubmit={() => {
          if (roleUpdateDialog.userId && roleUpdateDialog.newRole) {
            void handleRoleChange(roleUpdateDialog.userId, roleUpdateDialog.newRole);
          }
        }}
      />

      {/* Bulk Role Change Dialog */}
      <BulkRoleChangeDialog
        open={bulkRoleDialog.open}
        newRole={bulkRoleDialog.newRole}
        selectedCount={selectedIds.length}
        reason={reason}
        isUpdating={isUpdating}
        onOpenChange={(open) => setBulkRoleDialog({ ...bulkRoleDialog, open })}
        onNewRoleChange={(newRole) => setBulkRoleDialog({ ...bulkRoleDialog, newRole })}
        onReasonChange={setReason}
        onCancel={() => setBulkRoleDialog({ open: false })}
        onSubmit={() => void handleBulkRoleChange()}
      />
    </div>
  );
}
