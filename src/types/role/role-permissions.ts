import type { PredefinedRole } from "./role-definitions";
import type { Permission } from "./permission-types";
import { ADMIN_ROLE_PERMISSIONS } from "./role-permissions-admin";
import { MEMBERSHIP_ROLE_PERMISSIONS } from "./role-permissions-membership";

// Predefined role permissions
export const ROLE_PERMISSIONS: Record<PredefinedRole, Permission[]> = {
  ...ADMIN_ROLE_PERMISSIONS,
  ...MEMBERSHIP_ROLE_PERMISSIONS,
  // UI-39: demo is a custom role — isPredefinedRole("demo") is false, so this
  // entry is never read at runtime (its real permissions come from the
  // custom_roles row seeded by scripts/seed-demo.ts). It exists only to
  // satisfy the exhaustive Record<PredefinedRole, Permission[]>, and it
  // deliberately grants nothing.
  demo: [],
};
