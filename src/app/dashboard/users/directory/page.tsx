/**
 * User Directory — DataTable layer (UI-09 C3).
 *
 * Server-side pagination, sorting, search, and faceted filters over
 * GET /api/v1/members (no silent row cap — the table pages through the
 * whole directory). Rows open the detail modal on click or Enter; the
 * kebab menu offers live actions only (there is no user DELETE endpoint).
 * Bulk role changes reuse the UserActions bar (users:update gated).
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Copy, MoreHorizontal, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableDensityToggle,
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableSearch,
  type DataTableDensity,
} from "@/components/data-table";
import { useDataTableState } from "@/components/data-table";
import { UserActions } from "@/components/users/user-actions";
import { UserStats } from "@/components/users/user-stats";
import { UserDetailModal } from "@/components/users/user-detail-modal";
import { useHeader } from "@/contexts/dashboard-context";
import { useSession } from "@/hooks/use-session";
import { fetchMembersPage } from "@/lib/hooks/use-memberships";
import type { MemberApiItem } from "@/lib/hooks/use-memberships";
import { ROLE_DISPLAY_INFO, USER_ROLES, type UserRole } from "@/types/dashboard.types";
import { roleHasPermission } from "@/types/role";
import { AuthStatus, UserStatus } from "@/types/user-management.types";
import type { UserProfile, UserStats as UserStatsType } from "@/types/user-management.types";

type MemberStatus = MemberApiItem["memberStatus"];

/** Directory row: the modal's UserProfile plus the derived membership status. */
type DirectoryUser = UserProfile & { memberStatus: MemberStatus };

const MEMBER_STATUS_BADGE: Record<
  MemberStatus,
  { label: string; variant: "secondary" | "outline" | "destructive" }
> = {
  active: { label: "Active", variant: "secondary" },
  trialing: { label: "Trial", variant: "secondary" },
  in_grace: { label: "Winding down", variant: "outline" },
  paused: { label: "Paused", variant: "outline" },
  expired: { label: "Expired", variant: "destructive" },
  none: { label: "Not a member", variant: "outline" },
};

const MEMBER_STATUS_OPTIONS = (Object.keys(MEMBER_STATUS_BADGE) as MemberStatus[]).map(
  (status) => ({ label: MEMBER_STATUS_BADGE[status].label, value: status }),
);

const ROLE_OPTIONS = USER_ROLES.map((role) => ({
  label: ROLE_DISPLAY_INFO[role].name,
  value: role,
}));

/** Badge variants mirror the roles table so the directory reads the same. */
const ROLE_BADGE_VARIANT: Partial<
  Record<UserRole, "default" | "secondary" | "destructive" | "outline">
> = {
  superadmin: "destructive",
  admin: "default",
  staff: "default",
  treasurer: "default",
  chapter_president: "default",
};

function roleBadgeVariant(role: UserRole): "default" | "secondary" | "destructive" | "outline" {
  return ROLE_BADGE_VARIANT[role] ?? "outline";
}

/** Map a /api/v1/members row to the directory's row shape. */
function toDirectoryUser(member: MemberApiItem): DirectoryUser {
  const nameParts = member.name.split(" ");
  // The users schema stores role as free text; custom roles exceed this
  // union but the UI renders role strings verbatim.
  const userRole = member.role as UserRole;
  return {
    id: member.id,
    email: member.email,
    firstName: member.firstName ?? nameParts[0] ?? "",
    lastName: member.lastName ?? nameParts.slice(1).join(" "),
    username: member.username,
    avatar: member.image ?? undefined,
    bio: member.bio ?? undefined,
    userRole,
    status: member.emailVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
    authStatus: member.emailVerified ? AuthStatus.VERIFIED : AuthStatus.UNVERIFIED,
    emailVerified: member.emailVerified,
    phoneVerified: false, // no phone column in the users schema yet
    createdAt: new Date(member.createdAt),
    updatedAt: new Date(member.updatedAt),
    memberStatus: member.memberStatus,
  };
}

function initials(user: DirectoryUser): string {
  return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() || "?";
}

interface ChangeRoleDialogProps {
  user: DirectoryUser | null;
  onClose: () => void;
}

/** Single-user role change backed by PATCH /api/v1/admin/users/{id}/role. */
function ChangeRoleDialog({ user, onClose }: ChangeRoleDialogProps) {
  const queryClient = useQueryClient();
  const [newRole, setNewRole] = useState<UserRole>("member");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setNewRole(user.userRole);
      setReason("");
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: newRole,
          reason: reason.trim() || undefined,
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const detail =
          typeof body === "object" && body !== null && "detail" in body && body.detail
            ? String(body.detail)
            : "Failed to update role";
        toast.error(detail);
        return;
      }
      toast.success(`Role updated to ${ROLE_DISPLAY_INFO[newRole]?.name ?? newRole}`);
      void queryClient.invalidateQueries({ queryKey: ["users", "directory"] });
      onClose();
    } catch {
      toast.error("Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            {user ? `Update the role for ${user.firstName} ${user.lastName}.` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="change-role-select">New role</Label>
            <Select
              value={newRole}
              onValueChange={(value) => setNewRole(value as UserRole)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="change-role-select">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_DISPLAY_INFO[role].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="change-role-reason">Reason (optional)</Label>
            <Textarea
              id="change-role-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why is this role changing?"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Change role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UserRowActionsProps {
  user: DirectoryUser;
  canChangeRoles: boolean;
  onViewDetails: (user: DirectoryUser) => void;
  onChangeRole: (user: DirectoryUser) => void;
}

/** Live kebab actions for one directory row. No delete: the API has none. */
function UserRowActions({
  user,
  canChangeRoles,
  onViewDetails,
  onChangeRole,
}: UserRowActionsProps) {
  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-8"
          aria-label={`Actions for ${fullName}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => onViewDetails(user)}>
          <User aria-hidden="true" />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            void navigator.clipboard.writeText(user.email);
            toast.success(`Copied ${user.email}`);
          }}
        >
          <Copy aria-hidden="true" />
          Copy email
        </DropdownMenuItem>
        {canChangeRoles && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChangeRole(user)}>
              <ShieldCheck aria-hidden="true" />
              Change role
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function UserDirectoryPage() {
  const { setHeader, clearHeader } = useHeader();
  const { user: sessionUser } = useSession();
  const currentUserRole = sessionUser?.role as UserRole | undefined;
  const canChangeRoles = roleHasPermission(currentUserRole, "users:update");

  const { state, setSorting, setGlobalFilter, setColumnFilters, setPage, setPageSize } =
    useDataTableState({
      defaultPageSize: 20,
      filterParams: { role: "role", memberStatus: "memberStatus" },
    });

  const [density, setDensity] = useState<DataTableDensity>("comfortable");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [selectedUsers, setSelectedUsers] = useState<DirectoryUser[]>([]);
  const [profileUser, setProfileUser] = useState<DirectoryUser | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [roleChangeUser, setRoleChangeUser] = useState<DirectoryUser | null>(null);

  useEffect(() => {
    setHeader({
      title: "User Directory",
      description: "Manage and monitor platform users",
    });
    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const roleFilter = useMemo(
    () => (state.columnFilters.find((filter) => filter.id === "role")?.value as string[]) ?? [],
    [state.columnFilters],
  );
  const statusFilter = useMemo(
    () =>
      (state.columnFilters.find((filter) => filter.id === "memberStatus")?.value as string[]) ?? [],
    [state.columnFilters],
  );
  const sorting = state.sorting[0];

  const { data, isFetching, isError, error, refetch } = useQuery({
    // The ["users","directory"] prefix is load-bearing: UserActions and
    // ChangeRoleDialog invalidate it after role changes.
    queryKey: [
      "users",
      "directory",
      state.page,
      state.pageSize,
      state.globalFilter,
      roleFilter,
      statusFilter,
      sorting?.id ?? null,
      sorting?.desc ?? false,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(state.page));
      params.set("limit", String(state.pageSize));
      if (state.globalFilter.trim()) params.set("search", state.globalFilter.trim());
      if (sorting) {
        params.set("sortBy", sorting.id);
        params.set("sortOrder", sorting.desc ? "desc" : "asc");
      }
      for (const role of roleFilter) params.append("role", role);
      for (const status of statusFilter) params.append("memberStatus", status);
      return fetchMembersPage(params);
    },
    placeholderData: keepPreviousData,
  });

  const users = useMemo(() => (data?.data.members ?? []).map(toDirectoryUser), [data]);
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

  // Stats are computed from real loaded rows. Fields without a data source
  // in the users schema (2FA, last login, suspended state) report zero.
  const stats: UserStatsType = useMemo(() => {
    let activeUsers = 0;
    const roleDistribution = Object.fromEntries(USER_ROLES.map((role) => [role, 0])) as Record<
      UserRole,
      number
    >;
    let verifiedUsers = 0;
    let newUsersThisMonth = 0;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    for (const u of users) {
      if (u.status === UserStatus.ACTIVE) activeUsers += 1;
      if (u.emailVerified) verifiedUsers += 1;
      if (u.createdAt >= monthStart) newUsersThisMonth += 1;
      roleDistribution[u.userRole] = (roleDistribution[u.userRole] ?? 0) + 1;
    }

    return {
      totalUsers: total,
      activeUsers,
      inactiveUsers: 0, // no inactive/suspended account state in the schema yet
      suspendedUsers: 0,
      verifiedUsers,
      unverifiedUsers: users.length - verifiedUsers,
      usersWithTwoFactor: 0, // no 2FA data in the users schema yet
      roleDistribution,
      newUsersThisMonth,
      usersLastLogin30Days: 0, // login activity is not part of the members API
    };
  }, [users, total]);

  // Facet counts in manual mode come from the loaded page rows.
  const facetCounts = useCallback(
    (columnId: string) => {
      const counts = new Map<string, number>();
      for (const user of users) {
        const value =
          columnId === "role"
            ? user.userRole
            : columnId === "memberStatus"
              ? user.memberStatus
              : undefined;
        if (value) {
          counts.set(value, (counts.get(value) ?? 0) + 1);
        }
      }
      return counts;
    },
    [users],
  );

  const openProfile = useCallback((user: DirectoryUser) => {
    setProfileUser(user);
    setIsProfileOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<DirectoryUser>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => `${row.firstName} ${row.lastName}`.trim(),
        header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-8 shrink-0">
                <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="text-xs">{initials(user)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {`${user.firstName} ${user.lastName}`.trim() || user.email}
                </div>
                {user.username && (
                  <div className="text-muted-foreground truncate text-xs">@{user.username}</div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "email",
        accessorKey: "email",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
      },
      {
        id: "role",
        accessorFn: (row) => row.userRole,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
        cell: ({ row }) => {
          const role = row.original.userRole;
          return (
            <Badge variant={roleBadgeVariant(role)}>
              {ROLE_DISPLAY_INFO[role]?.name ?? role.replace(/_/g, " ")}
            </Badge>
          );
        },
      },
      {
        id: "memberStatus",
        accessorFn: (row) => row.memberStatus,
        header: "Member status",
        enableSorting: false,
        cell: ({ row }) => {
          const badge = MEMBER_STATUS_BADGE[row.original.memberStatus];
          return <Badge variant={badge.variant}>{badge.label}</Badge>;
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
        cell: ({ row }) => format(row.original.createdAt, "MMM d, yyyy"),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <UserRowActions
            user={row.original}
            canChangeRoles={canChangeRoles}
            onViewDetails={openProfile}
            onChangeRole={setRoleChangeUser}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [canChangeRoles, openProfile],
  );

  return (
    <div className="space-y-6">
      <UserStats stats={stats} />

      {canChangeRoles && selectedUsers.length > 0 && (
        <UserActions
          selectedUsers={selectedUsers.map((user) => user.id)}
          onClearSelection={() => setRowSelection({})}
          currentUserRole={currentUserRole}
        />
      )}

      <DataTable
        columns={columns}
        data={users}
        loading={isFetching && !data}
        error={
          isError
            ? error instanceof Error
              ? error.message
              : "Failed to load the user directory"
            : null
        }
        onRetry={() => void refetch()}
        caption="User directory"
        getRowId={(row) => row.id}
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
        columnFilters={state.columnFilters}
        onColumnFiltersChange={(updater) =>
          setColumnFilters(typeof updater === "function" ? updater(state.columnFilters) : updater)
        }
        getFacetedUniqueValues={facetCounts}
        enableSelection={canChangeRoles}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onSelectionChange={setSelectedUsers}
        onRowClick={openProfile}
        density={density}
        emptyTitle="No users found"
        emptyDescription="Try a different search, or clear the role and member status filters."
        toolbar={(table) => (
          <>
            <DataTableSearch
              value={state.globalFilter}
              onValueChange={setGlobalFilter}
              placeholder="Search users..."
            />
            <DataTableFacetedFilter
              column={table.getColumn("role")}
              title="Role"
              options={ROLE_OPTIONS}
            />
            <DataTableFacetedFilter
              column={table.getColumn("memberStatus")}
              title="Member status"
              options={MEMBER_STATUS_OPTIONS}
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
            selectedCount={selectedUsers.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      />

      <UserDetailModal
        user={profileUser}
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        currentUserRole={currentUserRole}
      />

      <ChangeRoleDialog user={roleChangeUser} onClose={() => setRoleChangeUser(null)} />
    </div>
  );
}
