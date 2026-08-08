/**
 * Permission Matrix
 *
 * Interactive grid component for visualizing and editing role permissions.
 * Shows all available permissions organized by category with role-based view.
 */

"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Shield } from "lucide-react";
import {
  AVAILABLE_PERMISSIONS,
  PERMISSION_CATEGORIES,
  ROLE_DISPLAY_INFO,
  isPredefinedRole,
} from "@/types/role";
import type { Permission, Role } from "@/types/role";

import {
  filterPermissions,
  getRoleBadgeVariant,
  getRolePermissions,
  groupPermissionsByModule,
  processPermissions,
} from "./helpers";
import { getPermissionIcon } from "./icons";
import { PermissionCell } from "./permission-cell";
import { PermissionLegend } from "./permission-legend";
import { PermissionRow } from "./permission-row";
import type { PermissionMatrixProps } from "./types";

export function PermissionMatrix({
  selectedRole = "user",
  onRoleChange,
  onPermissionToggle,
  viewOnly = false,
}: PermissionMatrixProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentRole, setCurrentRole] = useState<Role>(selectedRole);

  // Process permissions
  const allPermissions = processPermissions();

  // Get permissions for current role
  const rolePermissions = getRolePermissions(currentRole);

  // Filter permissions based on search and category
  const filteredPermissions = filterPermissions(allPermissions, searchTerm, selectedCategory);

  // Group permissions by module
  const groupedPermissions = groupPermissionsByModule(filteredPermissions);

  // Handle permission toggle
  const handlePermissionToggle = (permission: Permission, granted: boolean) => {
    if (viewOnly || !onPermissionToggle) return;
    onPermissionToggle(currentRole, permission, granted);
  };

  // Handle role change
  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    onRoleChange?.(role);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permission Matrix
              </CardTitle>
              <CardDescription>
                Visualize and manage role permissions across all system modules.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getRoleBadgeVariant(currentRole)}>{currentRole}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-4">
            {/* Role selector */}
            <div className="flex-1 min-w-64">
              <Label htmlFor="role-select">Select Role</Label>
              <Select value={currentRole} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_DISPLAY_INFO).map(([role, info]) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {role}
                        </Badge>
                        <span>{info.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View mode selector */}
            <div>
              <Label htmlFor="view-mode">View Mode</Label>
              <Select
                value={viewMode}
                onValueChange={(value) => setViewMode(value as "grid" | "table")}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(PERMISSION_CATEGORIES).map(([module, category]) => (
                  <SelectItem key={module} value={module}>
                    <div className="flex items-center gap-2">
                      {getPermissionIcon(module)}
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Tabs value={viewMode} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-6">
          <div className="grid gap-6">
            {Object.entries(groupedPermissions).map(([module, permissions]) => {
              const category = PERMISSION_CATEGORIES[module as keyof typeof PERMISSION_CATEGORIES];
              return (
                <Card key={module}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {getPermissionIcon(module)}
                      {category?.name || module}
                    </CardTitle>
                    <CardDescription>
                      {category?.description || `Manage ${module} permissions`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {permissions.map((permission) => (
                        <PermissionCell
                          key={permission.id}
                          permission={permission}
                          granted={rolePermissions.includes(permission.id)}
                          disabled={viewOnly || isPredefinedRole(currentRole)}
                          onToggle={handlePermissionToggle}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              <div className="h-[600px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Permission</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="w-[100px] text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPermissions.map((permission) => (
                      <PermissionRow
                        key={permission.id}
                        permission={permission}
                        granted={rolePermissions.includes(permission.id)}
                        disabled={viewOnly || isPredefinedRole(currentRole)}
                        onToggle={handlePermissionToggle}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <PermissionLegend
        grantedCount={rolePermissions.length}
        totalCount={AVAILABLE_PERMISSIONS.length}
      />
    </div>
  );
}
