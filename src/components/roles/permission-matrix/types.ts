/**
 * Permission Matrix Types
 *
 * Shared prop and data types for the permission matrix
 * component family.
 */

import type { PERMISSION_CATEGORIES, Permission, Role } from "@/types/role";

// Permission item interface
export interface PermissionItem {
  id: Permission;
  name: string;
  action: string;
  module: string;
  category: (typeof PERMISSION_CATEGORIES)[keyof typeof PERMISSION_CATEGORIES];
}

// Props interface
export interface PermissionMatrixProps {
  selectedRole?: Role;
  onRoleChange?: (role: Role) => void;
  onPermissionToggle?: (role: Role, permission: Permission, granted: boolean) => void;
  viewOnly?: boolean;
  showCustomRoles?: boolean;
}
