/**
 * Role-Based Access Control (RBAC) System
 *
 * Comprehensive role and permission definitions for the Nuvia AMS platform.
 * Supports predefined roles, custom roles, and granular permissions.
 */

export {
  PREDEFINED_ROLES,
  ROLE_DISPLAY_INFO,
  isPredefinedRole,
  USER_ROLES,
} from "./role-definitions";
export type { UserRole, PredefinedRole, Role } from "./role-definitions";

export { PERMISSION_MODULES, PERMISSION_ACTIONS } from "./permission-types";
export type { PermissionModule, PermissionAction, Permission } from "./permission-types";

export { AVAILABLE_PERMISSIONS } from "./available-permissions";

export { ROLE_PERMISSIONS } from "./role-permissions";

export { ROLE_HIERARCHY } from "./role-hierarchy";

export { PERMISSION_CATEGORIES } from "./permission-categories";

export { getRoleLevel, hasHigherRole, canManageRole, formatPermission } from "./role-utils";

export type { UserWithRoleInfo } from "./user-with-role-info";
