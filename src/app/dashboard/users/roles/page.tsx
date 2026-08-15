/**
 * User Roles Management Dashboard
 *
 * Comprehensive dashboard for managing user roles, permissions,
 * and role-based access control for the Nuvia AMS platform.
 */

"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Plus, Settings, Users } from "lucide-react";

// Import components
import { RoleManagementTable } from "@/components/roles/role-management-table";
import { PermissionMatrix } from "@/components/roles/permission-matrix";
import { PageErrorState } from "@/components/dashboard/page-states";

// Import types and services
import { Role } from "@/types/role";
import { useHeader } from "@/contexts/dashboard-context";

// Import local components
import { CustomRolesTab } from "./_components/custom-roles-tab";
import { OverviewTab } from "./_components/overview-tab";
import { RolesActionBar } from "./_components/roles-action-bar";
import { useRolesData } from "./_components/use-roles-data";

export default function UserRoles() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRole, setSelectedRole] = useState<Role>("user");
  const { setHeader, clearHeader } = useHeader();
  const {
    loading,
    error,
    roleStats,
    currentUserRole,
    loadData,
    handleRoleChange,
    handleBulkRoleChange,
    handlePermissionToggle,
  } = useRolesData();

  // Set header and active tab from URL parameter if available
  useEffect(() => {
    // Set the header
    setHeader({
      title: "Role Management",
      description: "Manage user roles, permissions, and access control for your organization.",
    });

    // Cleanup header on unmount
    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  return (
    <div className="space-y-6">
      {/* Header actions — title/description live in the shell header */}
      <RolesActionBar currentUserRole={currentUserRole} loading={loading} onRefresh={loadData} />

      {error && <PageErrorState error={error} onRetry={loadData} />}

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
          <OverviewTab roleStats={roleStats} loading={loading} onNavigate={setActiveTab} />
        </TabsContent>

        {/* User Roles Tab */}
        <TabsContent value="users" className="space-y-6">
          <RoleManagementTable
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
          <CustomRolesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
