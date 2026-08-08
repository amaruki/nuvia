/**
 * Role Management Table Types
 *
 * Shared prop and state types for the role management table
 * component family.
 */

import type { Role, UserWithRoleInfo } from "@/types/role";

// Props interface
export interface RoleManagementTableProps {
  users?: UserWithRoleInfo[];
  loading?: boolean;
  onRefresh?: () => void;
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
