/**
 * Data hook for the User Roles Management Dashboard.
 *
 * Owns fetching of users, role statistics, and the current session role,
 * plus the mutation handlers for individual and bulk role updates.
 */

"use client";

import { useEffect, useState } from "react";

import { RoleStatisticsData } from "@/components/roles/role-statistics";
import { logger } from "@/lib/logger";
import { Permission, Role, UserWithRoleInfo } from "@/types/role";

export function useRolesData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserWithRoleInfo[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStatisticsData | undefined>(undefined);
  const [currentUserRole, setCurrentUserRole] = useState<Role>("admin");

  // Load data
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load users with roles
      const usersResponse = await fetch("/api/v1/admin/users?includeRoles=true&limit=100");
      if (!usersResponse.ok) {
        throw new Error("Failed to load users");
      }
      const usersData = await usersResponse.json();

      // Load role statistics
      const statsResponse = await fetch("/api/v1/admin/roles?includeStats=true");
      if (!statsResponse.ok) {
        throw new Error("Failed to load statistics");
      }
      const statsData = await statsResponse.json();

      // Load current user role
      const sessionResponse = await fetch("/api/auth/session");
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        setCurrentUserRole(sessionData.user?.role || "user");
      }

      setUsers(usersData.data?.users || []);
      setRoleStats(
        statsData.data?.statistics || {
          totalUsers: 0,
          roleDistribution: {},
          roleBreakdown: [],
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Handle individual role change
  const handleRoleChange = async (userId: string, newRole: Role, reason?: string) => {
    try {
      const response = await fetch(`/api/v1/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: newRole,
          reason: reason || "Role updated by administrator",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update role");
      }

      // Refresh data
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
      throw err;
    }
  };

  // Handle bulk role change
  const handleBulkRoleChange = async (userIds: string[], newRole: Role, reason?: string) => {
    try {
      const response = await fetch("/api/v1/admin/users/bulk-role-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds,
          role: newRole,
          reason: reason || "Bulk role update by administrator",
          confirm: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update roles");
      }

      // Refresh data
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update roles");
      throw err;
    }
  };

  // Handle permission toggle (for custom roles)
  const handlePermissionToggle = async (role: Role, permission: Permission, granted: boolean) => {
    // TODO: Implement custom role permission management
    logger.info("Permission toggle", { role, permission, granted });
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  return {
    loading,
    error,
    users,
    roleStats,
    currentUserRole,
    loadData,
    handleRoleChange,
    handleBulkRoleChange,
    handlePermissionToggle,
  };
}
