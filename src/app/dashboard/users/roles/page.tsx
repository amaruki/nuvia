/**
 * User Roles Management Dashboard
 *
 * Comprehensive dashboard for managing user roles, permissions,
 * and role-based access control for the Nuvia AMS platform.
 */

"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  Settings,
  BarChart,
  Lock,
  AlertTriangle,
  RefreshCw,
  Plus,
} from "lucide-react";

// Import components
import { RoleManagementTable } from "@/components/roles/role-management-table";
import { PermissionMatrix } from "@/components/roles/permission-matrix";
import { RoleStatistics, RoleStatisticsData } from "@/components/roles/role-statistics";

// Import types and services
import { Role, Permission } from "@/types/role.types";
import { UserWithRoleInfo } from "@/lib/services/role.service";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";

export default function UserRoles() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const { setHeader, clearHeader } = useHeader();
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserWithRoleInfo[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStatisticsData | undefined>(undefined);
  const [currentUserRole, setCurrentUserRole] = useState<Role>("admin");
  const [selectedRole, setSelectedRole] = useState<Role>("user");

  // Set header and active tab from URL parameter if available
  useEffect(() => {
    // Set the header
    setHeader({
      title: "Role Management",
      description: "Manage user roles, permissions, and access control for your organization.",
    });
    setLoading(false);

    // Cleanup header on unmount
    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">
            Manage user roles, permissions, and access control for your organization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            Current Role: {currentUserRole}
          </Badge>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Roles
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Permission Matrix
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Custom Roles
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RoleStatistics data={roleStats} loading={loading} />
            </div>
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setActiveTab("users")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage User Roles
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setActiveTab("permissions")}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    View Permissions
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setActiveTab("custom")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Custom Role
                  </Button>
                </CardContent>
              </Card>

              {/* Role Hierarchy Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Role Hierarchy</CardTitle>
                  <CardDescription>Understanding role privileges and access levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">Super Admin</span>
                      <Badge variant="destructive">Full Access</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">Admin</span>
                      <Badge variant="default">Admin Access</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">Staff</span>
                      <Badge variant="secondary">Staff Access</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">Leadership</span>
                      <Badge variant="outline">Limited Admin</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">Members</span>
                      <Badge variant="outline">Basic Access</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* User Roles Tab */}
        <TabsContent value="users" className="space-y-6">
          <RoleManagementTable
            users={users}
            loading={loading}
            onRefresh={loadData}
            onRoleChange={handleRoleChange}
            onBulkRoleChange={handleBulkRoleChange}
            currentUserRole={currentUserRole}
          />
        </TabsContent>

        {/* Permission Matrix Tab */}
        <TabsContent value="matrix" className="space-y-6">
          <PermissionMatrix
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            onPermissionToggle={handlePermissionToggle}
            viewOnly={false}
            showCustomRoles={true}
          />
        </TabsContent>

        {/* Custom Roles Tab */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Custom Roles
              </CardTitle>
              <CardDescription>
                Create and manage custom roles with specific permission sets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Custom Role Management</h3>
                <p className="text-muted-foreground mb-4">
                  Create custom roles with specific permission combinations that fit your
                  organization's needs.
                </p>
                <Button>Create Custom Role</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
