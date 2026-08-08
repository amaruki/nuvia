import type { PredefinedRole } from "./role-definitions";
import type { Permission } from "./permission-types";
import { ADMIN_ROLE_PERMISSIONS } from "./role-permissions-admin";
import { MEMBERSHIP_ROLE_PERMISSIONS } from "./role-permissions-membership";

// Predefined role permissions
export const ROLE_PERMISSIONS: Record<PredefinedRole, Permission[]> = {
  ...ADMIN_ROLE_PERMISSIONS,
  ...MEMBERSHIP_ROLE_PERMISSIONS,
};
