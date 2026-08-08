/**
 * Shared RBAC types.
 *
 * Shapes used across the current-user, permission-check, role-check,
 * role-assignment, and role-query modules. The role and permission
 * vocabularies themselves live in `@/types/role`.
 */

import type { Permission, Role } from "@/types/role";

// Enhanced user type with role information
export interface UserWithRole {
  id: string;
  email: string;
  username: string;
  name?: string;
  displayName?: string;
  role: Role;
  permissions?: Permission[];
}

// Custom role interface for database storage
export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Role assignment change for audit logging
export interface RoleAssignmentChange {
  userId: string;
  previousRole: Role;
  newRole: Role;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}
