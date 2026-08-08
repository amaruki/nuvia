import type { Role } from "./role-definitions";
import type { Permission } from "./permission-types";

/**
 * User row shaped for role-management UIs (the admin users API plus the
 * resolved permissions of the user's role). Moved here verbatim when
 * src/lib/services/role.service.ts was deleted — the type was the only
 * thing its importers still used.
 */
export interface UserWithRoleInfo {
  id: string;
  username: string;
  email: string;
  name?: string;
  displayName?: string | null;
  role: Role;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}
