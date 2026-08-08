/**
 * Permission Matrix Data Helpers
 *
 * Pure helpers that prepare, filter, group, and style permission
 * data for the matrix views.
 */

import {
  AVAILABLE_PERMISSIONS,
  PERMISSION_CATEGORIES,
  ROLE_PERMISSIONS,
  isPredefinedRole,
} from "@/types/role";
import type { Permission, Role } from "@/types/role";

import type { PermissionItem } from "./types";

// Process permissions
export const processPermissions = (): PermissionItem[] => {
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

// Get permissions for a role
export const getRolePermissions = (role: Role): Permission[] => {
  if (isPredefinedRole(role)) {
    return ROLE_PERMISSIONS[role];
  }
  return []; // TODO: Get custom role permissions
};

// Filter permissions based on search and category
export const filterPermissions = (
  permissions: PermissionItem[],
  searchTerm: string,
  selectedCategory: string,
): PermissionItem[] => {
  return permissions.filter((permission) => {
    const matchesSearch =
      searchTerm === "" ||
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "all" || permission.module === selectedCategory;

    return matchesSearch && matchesCategory;
  });
};

// Group permissions by module
export const groupPermissionsByModule = (
  permissions: PermissionItem[],
): Record<string, PermissionItem[]> => {
  return permissions.reduce(
    (groups, permission) => {
      if (!groups[permission.module]) {
        groups[permission.module] = [];
      }
      groups[permission.module].push(permission);
      return groups;
    },
    {} as Record<string, PermissionItem[]>,
  );
};

// Get role badge color
export const getRoleBadgeVariant = (
  role: Role,
): "default" | "secondary" | "destructive" | "outline" => {
  if (role === "superadmin") return "destructive";
  if (role === "admin") return "default";
  if (["staff", "treasurer", "chapter_president"].includes(role)) return "default";
  return "outline";
};
