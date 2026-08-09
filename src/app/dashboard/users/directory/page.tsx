"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserDirectory } from "@/components/users/user-directory";
import { AuthStatus, UserStatus } from "@/types/user-management.types";
import type { UserFilter, UserProfile, UserSort, UserStats } from "@/types/user-management.types";
import { USER_ROLES } from "@/types/dashboard.types";
import type { UserRole } from "@/types/dashboard.types";
import { useHeader } from "@/contexts/dashboard-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchMembersPage } from "@/lib/hooks/use-memberships";
import type { MemberApiItem } from "@/lib/hooks/use-memberships";
import { useSession } from "@/hooks/use-session";

const DIRECTORY_LIMIT = 100;

/** Normalize sortable profile values (dates, missing values) for comparison. */
function toComparable(value: unknown): string | number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" || typeof value === "number") return value;
  return "";
}

/** Map a /api/v1/members row to the directory's UserProfile shape. */
function toUserProfile(member: MemberApiItem): UserProfile {
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
  };
}

export default function UserDirectoryPage() {
  const [filters, setFilters] = useState<UserFilter>({});
  const { setHeader, clearHeader } = useHeader();
  const { user: sessionUser } = useSession();
  const [sort, setSort] = useState<UserSort>({
    field: "createdAt",
    direction: "desc",
  });

  // Set header and active tab from URL parameter if available
  useEffect(() => {
    setHeader({
      title: "User Directory",
      description: "Manage and monitor platform users",
    });

    // Cleanup header on unmount
    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  // Debounce the search box so typing does not fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search ?? ""), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const rolesKey = (filters.roles ?? []).join(",");
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["user-directory", debouncedSearch, rolesKey],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("limit", String(DIRECTORY_LIMIT));
      if (debouncedSearch) params.set("search", debouncedSearch);
      for (const role of filters.roles ?? []) params.append("role", role);
      return fetchMembersPage(params);
    },
  });

  const apiUsers = useMemo(() => (data?.data.members ?? []).map(toUserProfile), [data]);
  const total = data?.meta.total ?? 0;

  // Stats are computed from real loaded rows. Fields without a data source
  // in the users schema (2FA, last login, suspended state) report zero.
  const stats: UserStats = useMemo(() => {
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

    for (const u of apiUsers) {
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
      unverifiedUsers: apiUsers.length - verifiedUsers,
      usersWithTwoFactor: 0, // no 2FA data in the users schema yet
      roleDistribution,
      newUsersThisMonth,
      usersLastLogin30Days: 0, // login activity is not part of the members API
    };
  }, [apiUsers, total]);

  // Filter and sort the loaded rows. Search and role filters already run
  // server-side; the remaining criteria are not supported by the API yet.
  const filteredUsers = useMemo(() => {
    let filtered = [...apiUsers];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.username?.toLowerCase().includes(searchLower),
      );
    }

    // Apply role filter
    if (filters.roles?.length) {
      filtered = filtered.filter((user) => filters.roles!.includes(user.userRole));
    }

    // Apply status filter
    if (filters.statuses?.length) {
      filtered = filtered.filter((user) => filters.statuses!.includes(user.status));
    }

    // Apply auth status filter
    if (filters.authStatuses?.length) {
      filtered = filtered.filter((user) => filters.authStatuses!.includes(user.authStatus));
    }

    // Apply email verification filter
    if (filters.emailVerified !== undefined) {
      filtered = filtered.filter((user) => user.emailVerified === filters.emailVerified);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = sort;
      const rawA =
        field === "name" ? `${a.firstName} ${a.lastName}` : a[field as keyof UserProfile];
      const rawB =
        field === "name" ? `${b.firstName} ${b.lastName}` : b[field as keyof UserProfile];
      const aValue = toComparable(rawA);
      const bValue = toComparable(rawB);

      if (aValue === bValue) return 0;
      const comparison = aValue < bValue ? -1 : 1;
      return direction === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [apiUsers, filters, sort]);

  if (isError) {
    const message = error instanceof Error ? error.message : "Failed to load the user directory";
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Could not load the user directory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button onClick={() => void refetch()}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <UserDirectory
          users={filteredUsers}
          total={total}
          stats={stats}
          filters={filters}
          sort={sort}
          isLoading={isLoading}
          onFilterChange={setFilters}
          onSortChange={setSort}
          onClearFilters={() => setFilters({})}
          currentUserRole={sessionUser?.role as UserRole | undefined}
        />
      </main>
    </div>
  );
}
