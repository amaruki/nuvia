/**
 * Role-Based Access Control (RBAC) Utilities
 *
 * Provides permission checking, role validation, and access control functions
 * for the Nuvia AMS platform.
 *
 * Split out of a single rbac.ts into seam modules (same pattern as the
 * src/components/ui/sidebar split): types, current-user resolution,
 * permission checks, role checks, role assignment/mutation, and role
 * queries. This barrel keeps the `@/lib/rbac` specifier working unchanged
 * for every consumer.
 */

export type { UserWithRole, CustomRole, RoleAssignmentChange } from "./types";
export { getCurrentUser } from "./current-user";
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
} from "./permission-checks";
export { hasRole, requireRole, canManageUserRole } from "./role-checks";
export type { RoleAssignmentErrorCode } from "./role-assignment";
export {
  canAssignRole,
  canGrantPermissions,
  checkRoleAssignable,
  changeUserRole,
  isLastSuperadmin,
  runUnlessLastSuperadmin,
} from "./role-assignment";
export { getRoleStatistics, getAllRoles, getUserPermissions } from "./role-queries";
