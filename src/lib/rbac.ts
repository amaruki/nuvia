/**
 * Role-Based Access Control (RBAC) Utilities
 *
 * Provides permission checking, role validation, and access control functions
 * for the Nuvia AMS platform.
 */

import { count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog, user } from "@/db/schema";
import { auth } from "./auth";
import { headers } from "next/headers";
import {
  Role,
  PredefinedRole,
  Permission,
  ROLE_PERMISSIONS,
  isPredefinedRole,
  canManageRole,
  getRoleLevel,
} from "@/types/role.types";
import { AuthError, AuthErrorType } from "./auth/common";

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

/**
 * Get current user session with role and permissions
 */
export async function getCurrentUser(): Promise<UserWithRole | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return null;
    }

    const sessionUser = session.user as any;

    // Get user role from database (in case it's not in session)
    let role = sessionUser.role || "user";

    // Get permissions for the user's role
    let permissions: Permission[] = [];

    if (isPredefinedRole(role)) {
      permissions = ROLE_PERMISSIONS[role as PredefinedRole];
    } else {
      // For custom roles, get permissions from database
      // TODO: Implement customRole lookup here — the custom_roles table
      // exists (src/db/schema/auth.ts: customRole) and a full admin UI
      // ships on top of it, but nothing reads it yet. Tracked in TODO.md.
      /*
      const role = await db.query.customRole.findFirst({
        where: (customRole, { eq }) => eq(customRole.name, role),
        columns: { permissions: true },
      });

      if (role) {
        permissions = role.permissions as Permission[];
      }
      */

      // For now, give custom roles no permissions
      permissions = [];
    }

    return {
      id: sessionUser.id,
      email: sessionUser.email,
      username: sessionUser.username,
      name: sessionUser.name,
      displayName: sessionUser.displayName,
      role,
      permissions,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Check if current user has specific permission
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return false;
  }

  // Superadmin has all permissions
  if (currentUser.role === "superadmin") {
    return true;
  }

  // Check if user has the specific permission
  return currentUser.permissions?.includes(permission) || false;
}

/**
 * Check if current user has any of the specified permissions
 */
export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return false;
  }

  // Superadmin has all permissions
  if (currentUser.role === "superadmin") {
    return true;
  }

  return permissions.some((permission) => currentUser.permissions?.includes(permission) || false);
}

/**
 * Check if current user has all of the specified permissions
 */
export async function hasAllPermissions(permissions: Permission[]): Promise<boolean> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return false;
  }

  // Superadmin has all permissions
  if (currentUser.role === "superadmin") {
    return true;
  }

  return permissions.every((permission) => currentUser.permissions?.includes(permission) || false);
}

/**
 * Check if current user has specific role or higher privilege level
 */
export async function hasRole(minRole: PredefinedRole): Promise<boolean> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return false;
  }

  // Superadmin always has access
  if (currentUser.role === "superadmin") {
    return true;
  }

  const userLevel = getRoleLevel(currentUser.role);
  const requiredLevel = getRoleLevel(minRole);

  return userLevel >= requiredLevel;
}

/**
 * Authorization middleware function
 */
export async function requirePermission(permission: Permission): Promise<{
  success: boolean;
  user?: UserWithRole;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        error: "UNAUTHORIZED",
      };
    }

    const hasRequiredPermission = await hasPermission(permission);

    if (!hasRequiredPermission) {
      return {
        success: false,
        error: "FORBIDDEN",
      };
    }

    return {
      success: true,
      user: currentUser,
    };
  } catch (error) {
    console.error("Error in requirePermission:", error);
    return {
      success: false,
      error: "INTERNAL_ERROR",
    };
  }
}

/**
 * Authorization middleware for minimum role level
 */
export async function requireRole(minRole: PredefinedRole): Promise<{
  success: boolean;
  user?: UserWithRole;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        error: "UNAUTHORIZED",
      };
    }

    const hasRequiredRole = await hasRole(minRole);

    if (!hasRequiredRole) {
      return {
        success: false,
        error: "FORBIDDEN",
      };
    }

    return {
      success: true,
      user: currentUser,
    };
  } catch (error) {
    console.error("Error in requireRole:", error);
    return {
      success: false,
      error: "INTERNAL_ERROR",
    };
  }
}

/**
 * Check if a user can manage another user's role
 */
export async function canManageUserRole(managerId: string, targetUserId: string): Promise<boolean> {
  try {
    // Get both users
    const [manager, target] = await Promise.all([
      db.query.user.findFirst({
        where: eq(user.id, managerId),
        columns: { role: true },
      }),
      db.query.user.findFirst({
        where: eq(user.id, targetUserId),
        columns: { role: true },
      }),
    ]);

    if (!manager || !target) {
      return false;
    }

    // Cannot manage yourself
    if (managerId === targetUserId) {
      return false;
    }

    return canManageRole(manager.role as Role, target.role as Role);
  } catch (error) {
    console.error("Error checking role management permission:", error);
    return false;
  }
}

/**
 * Change user role with validation and audit logging
 */
export async function changeUserRole(
  targetUserId: string,
  newRole: Role,
  changedBy: string,
  reason?: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate that the changer can manage the target user's role
    const canManage = await canManageUserRole(changedBy, targetUserId);

    if (!canManage) {
      return {
        success: false,
        error: "INSUFFICIENT_PERMISSIONS",
      };
    }

    // Get current role for audit
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, targetUserId),
      columns: { role: true },
    });

    if (!targetUser) {
      return {
        success: false,
        error: "USER_NOT_FOUND",
      };
    }

    // If role is the same, no change needed
    if (targetUser.role === newRole) {
      return {
        success: true,
      };
    }

    // Update the role and write the audit entry in one transaction — the
    // original Prisma version ran these as two separate, un-transacted
    // statements, so a failure between them could silently drop the audit
    // trail. See docs/adr/0009-security-hardening-p0.md.
    await db.transaction(async (tx) => {
      await tx.update(user).set({ role: newRole }).where(eq(user.id, targetUserId));

      await tx.insert(authLog).values({
        userId: targetUserId,
        eventType: "ROLE_CHANGE",
        severity: "INFO",
        message: `Role changed from ${targetUser.role} to ${newRole}`,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        metadata: {
          previousRole: targetUser.role,
          newRole,
          changedBy,
          reason,
        },
      });
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error changing user role:", error);
    return {
      success: false,
      error: "INTERNAL_ERROR",
    };
  }
}

/**
 * Get role statistics for dashboard
 */
export async function getRoleStatistics(): Promise<{
  totalUsers: number;
  roleDistribution: Record<Role, number>;
  roleBreakdown: Array<{
    role: Role;
    count: number;
    percentage: number;
    displayName: string;
    description: string;
    category: string;
  }>;
}> {
  try {
    // Get role distribution
    const roleStats = await db
      .select({ role: user.role, count: count() })
      .from(user)
      .groupBy(user.role);

    const roleDistribution: Record<string, number> = {};
    let totalUsers = 0;

    roleStats.forEach((stat) => {
      roleDistribution[stat.role] = stat.count;
      totalUsers += stat.count;
    });

    // Get role display info for breakdown
    const { ROLE_DISPLAY_INFO, PREDEFINED_ROLES } = await import("@/types/role.types");

    const roleBreakdown = PREDEFINED_ROLES.map((role) => {
      const roleCount = roleDistribution[role] || 0;
      const percentage = totalUsers > 0 ? Math.round((roleCount / totalUsers) * 100) : 0;
      const roleInfo = ROLE_DISPLAY_INFO[role];

      return {
        role,
        count: roleCount,
        percentage,
        displayName: roleInfo.name,
        description: roleInfo.description,
        category: roleInfo.category,
      };
    }).filter((item) => item.count > 0); // Only include roles with users

    return {
      totalUsers,
      roleDistribution,
      roleBreakdown,
    };
  } catch (error) {
    console.error("Error getting role statistics:", error);
    return {
      totalUsers: 0,
      roleDistribution: {},
      roleBreakdown: [],
    };
  }
}

/**
 * Get all roles (predefined + custom) for UI display
 */
export async function getAllRoles(): Promise<
  Array<{
    role: Role;
    name: string;
    description?: string;
    isPredefined: boolean;
    userCount: number;
  }>
> {
  try {
    // Get predefined roles with user counts
    const predefinedRoleStats = await db
      .select({ role: user.role, count: count() })
      .from(user)
      .groupBy(user.role);

    const roleUserCounts: Record<string, number> = {};
    predefinedRoleStats.forEach((stat) => {
      roleUserCounts[stat.role] = stat.count;
    });

    // Get predefined roles info
    const { ROLE_DISPLAY_INFO, PREDEFINED_ROLES } = await import("@/types/role.types");

    const roles = PREDEFINED_ROLES.map((role) => ({
      role,
      name: ROLE_DISPLAY_INFO[role].name,
      description: ROLE_DISPLAY_INFO[role].description,
      isPredefined: true,
      userCount: roleUserCounts[role] || 0,
    }));

    // TODO: Add custom roles when we implement the CustomRole model
    // For now, only return predefined roles

    return roles;
  } catch (error) {
    console.error("Error getting all roles:", error);
    return [];
  }
}

/**
 * Validate role assignment business rules
 */
export function validateRoleAssignment(
  currentRole: Role,
  newRole: Role,
  assignerRole: Role,
): {
  valid: boolean;
  reason?: string;
} {
  // Cannot assign superadmin role unless you are superadmin
  if (newRole === "superadmin" && assignerRole !== "superadmin") {
    return {
      valid: false,
      reason: "Only Super Admin can assign Super Admin role",
    };
  }

  // Cannot promote someone to same or higher level than yourself
  if (!canManageRole(assignerRole, newRole)) {
    return {
      valid: false,
      reason: "Cannot assign role higher than or equal to your own",
    };
  }

  // Special validation for role changes that would privilege escalation
  if (getRoleLevel(newRole) > getRoleLevel(assignerRole)) {
    return {
      valid: false,
      reason: "Cannot assign role with higher privilege level than your own",
    };
  }

  return {
    valid: true,
  };
}

/**
 * Get effective permissions for a user (including role-based and custom permissions)
 */
export async function getUserPermissions(userId: string): Promise<{
  role: Role;
  permissions: Permission[];
}> {
  try {
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { role: true },
    });

    if (!targetUser) {
      throw new Error("User not found");
    }

    let permissions: Permission[] = [];

    if (isPredefinedRole(targetUser.role as Role)) {
      permissions = ROLE_PERMISSIONS[targetUser.role as PredefinedRole];
    } else {
      // TODO: Get custom role permissions from database
      // For now, return empty permissions for custom roles
    }

    return {
      role: targetUser.role as Role,
      permissions,
    };
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return {
      role: "user",
      permissions: [],
    };
  }
}
