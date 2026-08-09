/**
 * Role Management Table Types
 *
 * Shared prop and state types for the role management table
 * component family.
 */

import type { Role } from "@/types/role";

// Props interface — the table fetches its own server-paginated user list;
// the page only supplies the mutation handlers and the viewer's role.
export interface RoleManagementTableProps {
  onRoleChange?: (userId: string, newRole: Role, reason?: string) => Promise<void>;
  onBulkRoleChange?: (userIds: string[], newRole: Role, reason?: string) => Promise<void>;
  currentUserRole?: Role;
}

// State of the individual role update dialog
export interface RoleUpdateDialogState {
  open: boolean;
  userId?: string;
  currentRole?: Role;
  newRole?: Role;
}

// State of the bulk role update dialog
export interface BulkRoleDialogState {
  open: boolean;
  newRole?: Role;
}
