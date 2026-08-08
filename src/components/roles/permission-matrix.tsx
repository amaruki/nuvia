/**
 * Permission Matrix
 *
 * Interactive grid component for visualizing and editing role permissions.
 * Shows all available permissions organized by category with role-based view.
 */

"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Settings,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Mail,
  BarChart,
  Building,
  MessageSquare,
  Briefcase,
  BookOpen,
  Search,
  Lock,
  Unlock,
} from "lucide-react";
import {
  Permission,
  Role,
  PERMISSION_CATEGORIES,
  AVAILABLE_PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_DISPLAY_INFO,
  isPredefinedRole,
} from "@/types/role";

// Permission item interface
interface PermissionItem {
  id: Permission;
  name: string;
  action: string;
  module: string;
  category: (typeof PERMISSION_CATEGORIES)[keyof typeof PERMISSION_CATEGORIES];
}

// Props interface
interface PermissionMatrixProps {
  selectedRole?: Role;
  onRoleChange?: (role: Role) => void;
  onPermissionToggle?: (role: Role, permission: Permission, granted: boolean) => void;
  viewOnly?: boolean;
  showCustomRoles?: boolean;
}

export function PermissionMatrix({
  selectedRole = "user",
  onRoleChange,
  onPermissionToggle,
  viewOnly = false,
  showCustomRoles = false,
}: PermissionMatrixProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentRole, setCurrentRole] = useState<Role>(selectedRole);

  // Get permission icon
  const getPermissionIcon = (module: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      users: <Users className="h-4 w-4" />,
      events: <Calendar className="h-4 w-4" />,
      finance: <DollarSign className="h-4 w-4" />,
      content: <FileText className="h-4 w-4" />,
      communications: <Mail className="h-4 w-4" />,
      analytics: <BarChart className="h-4 w-4" />,
      organization: <Building className="h-4 w-4" />,
      forum: <MessageSquare className="h-4 w-4" />,
      jobs: <Briefcase className="h-4 w-4" />,
      learning: <BookOpen className="h-4 w-4" />,
      system: <Settings className="h-4 w-4" />,
      memberships: <Users className="h-4 w-4" />,
    };
    return iconMap[module] || <Shield className="h-4 w-4" />;
  };

  // Process permissions
  const processPermissions = (): PermissionItem[] => {
    return AVAILABLE_PERMISSIONS.map((permission) => {
      const [module, action] = permission.split(":");
      const category = PERMISSION_CATEGORIES[module as keyof typeof PERMISSION_CATEGORIES];

      return {
        id: permission,
        name: `${category?.name || module} - ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        action: action.charAt(0).toUpperCase() + action.slice(1),
        module,
        category: category || {
          name: module,
          description: `Manage ${module}`,
          icon: "settings",
          color: "gray",
        },
      };
    });
  };

  const allPermissions = processPermissions();

  // Get permissions for current role
  const getRolePermissions = (): Permission[] => {
    if (isPredefinedRole(currentRole)) {
      return ROLE_PERMISSIONS[currentRole];
    }
    return []; // TODO: Get custom role permissions
  };

  const rolePermissions = getRolePermissions();

  // Filter permissions based on search and category
  const filteredPermissions = allPermissions.filter((permission) => {
    const matchesSearch =
      searchTerm === "" ||
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "all" || permission.module === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group permissions by module
  const groupedPermissions = filteredPermissions.reduce(
    (groups, permission) => {
      if (!groups[permission.module]) {
        groups[permission.module] = [];
      }
      groups[permission.module].push(permission);
      return groups;
    },
    {} as Record<string, PermissionItem[]>,
  );

  // Check if permission is granted for current role
  const isPermissionGranted = (permission: Permission): boolean => {
    return rolePermissions.includes(permission);
  };

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

  // Get role badge color
  const getRoleBadgeVariant = (role: Role): "default" | "secondary" | "destructive" | "outline" => {
    if (role === "superadmin") return "destructive";
    if (role === "admin") return "default";
    if (["staff", "treasurer", "chapter_president"].includes(role)) return "default";
    return "outline";
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
                        <div
                          key={permission.id}
                          className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <Checkbox
                            id={permission.id}
                            checked={isPermissionGranted(permission.id)}
                            onCheckedChange={(checked) =>
                              handlePermissionToggle(permission.id, checked as boolean)
                            }
                            disabled={viewOnly || isPredefinedRole(currentRole)}
                          />
                          <div className="flex-1 space-y-1">
                            <Label
                              htmlFor={permission.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.action}
                            </Label>
                            <p className="text-xs text-muted-foreground">{permission.module}</p>
                          </div>
                          {isPermissionGranted(permission.id) ? (
                            <Unlock className="h-4 w-4 text-green-600" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
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
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPermissionIcon(permission.module)}
                            <div>
                              <div className="font-medium">{permission.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {permission.category.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{permission.module}</Badge>
                        </TableCell>
                        <TableCell>{permission.action}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={isPermissionGranted(permission.id)}
                            onCheckedChange={(checked) =>
                              handlePermissionToggle(permission.id, checked as boolean)
                            }
                            disabled={viewOnly || isPredefinedRole(currentRole)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Permission Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">{rolePermissions.length}</div>
              <div className="text-sm text-muted-foreground">Granted Permissions</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-muted-foreground">
                {AVAILABLE_PERMISSIONS.length - rolePermissions.length}
              </div>
              <div className="text-sm text-muted-foreground">Denied Permissions</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{AVAILABLE_PERMISSIONS.length}</div>
              <div className="text-sm text-muted-foreground">Total Permissions</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {Math.round((rolePermissions.length / AVAILABLE_PERMISSIONS.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Access Level</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
