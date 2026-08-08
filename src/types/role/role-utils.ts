import { isPredefinedRole } from "../dashboard.types";
import type { Role } from "./role-definitions";
import type { Permission, PermissionModule } from "./permission-types";
import { ROLE_HIERARCHY } from "./role-hierarchy";
import { PERMISSION_CATEGORIES } from "./permission-categories";

// Utility functions for role and permission checking
// isPredefinedRole is now imported from dashboard.types

export const getRoleLevel = (role: Role): number => {
  if (isPredefinedRole(role)) {
    return ROLE_HIERARCHY[role];
  }
  return 0; // Custom roles have level 0 by default
};

export const hasHigherRole = (role1: Role, role2: Role): boolean => {
  return getRoleLevel(role1) > getRoleLevel(role2);
};

export const canManageRole = (managerRole: Role, targetRole: Role): boolean => {
  // Superadmin can manage anyone
  if (managerRole === "superadmin") return true;

  // Cannot manage superadmin unless you are superadmin
  if (targetRole === "superadmin") return false;

  // Cannot manage same or higher role
  return hasHigherRole(managerRole, targetRole);
};

export const formatPermission = (permission: Permission): string => {
  const [module, action] = permission.split(":");
  const category = PERMISSION_CATEGORIES[module as PermissionModule];
  return `${category?.name || module} - ${action.charAt(0).toUpperCase() + action.slice(1)}`;
};
