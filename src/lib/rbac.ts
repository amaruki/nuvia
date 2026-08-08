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
} from "@/types/role";
import { problems, type ProblemDetails } from "@/lib/http";
import { logger } from "@/lib/logger";
import { invalidateUserSessionCaches } from "@/lib/session-cache";

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
 * Get current user session with role and permissions.
 *
 * `headersOverride` lets a caller pass request headers explicitly instead
 * of relying on next/headers's ambient headers() — needed outside a live
 * Next.js request lifecycle (e.g. bun:test calling this directly).
 */
export async function getCurrentUser(headersOverride?: Headers): Promise<UserWithRole | null> {
  try {
    const session = await auth.api.getSession({
      headers: headersOverride ?? (await headers()),
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
      // Not one of the 14 predefined roles — user.role holds a custom
      // role's name instead (custom_roles.name, unique).
      const customRoleRecord = await db.query.customRole.findFirst({
        where: (customRoleTable, { eq: eqOp }) => eqOp(customRoleTable.name, role),
        columns: { permissions: true, isActive: true },
      });

      permissions = customRoleRecord?.isActive
        ? (customRoleRecord.permissions as Permission[])
        : [];
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
    logger.error("Error getting current user", error);
    return null;
  }
}

/**
 * Check if current user has specific permission
 */
export async function hasPermission(
  permission: Permission,
  headersOverride?: Headers,
): Promise<boolean> {
  const currentUser = await getCurrentUser(headersOverride);

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
export async function hasAnyPermission(
  permissions: Permission[],
  headersOverride?: Headers,
): Promise<boolean> {
  const currentUser = await getCurrentUser(headersOverride);

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
export async function hasAllPermissions(
  permissions: Permission[],
  headersOverride?: Headers,
): Promise<boolean> {
  const currentUser = await getCurrentUser(headersOverride);

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
export async function hasRole(
  minRole: PredefinedRole,
  headersOverride?: Headers,
): Promise<boolean> {
  const currentUser = await getCurrentUser(headersOverride);

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
export async function requirePermission(
  permission: Permission,
  headersOverride?: Headers,
): Promise<{
  success: boolean;
  user?: UserWithRole;
  error?: ProblemDetails;
}> {
  try {
    const currentUser = await getCurrentUser(headersOverride);

    if (!currentUser) {
      return {
        success: false,
        error: problems.authenticationRequired(),
      };
    }

    const hasRequiredPermission = await hasPermission(permission, headersOverride);

    if (!hasRequiredPermission) {
      return {
        success: false,
        error: problems.insufficientPermission(`Requires ${permission}`),
      };
    }

    return {
      success: true,
      user: currentUser,
    };
  } catch (error) {
    logger.error("Error in requirePermission", error);
    return {
      success: false,
      error: problems.internalError(),
    };
  }
}

/**
 * Authorization middleware for minimum role level
 */
export async function requireRole(
  minRole: PredefinedRole,
  headersOverride?: Headers,
): Promise<{
  success: boolean;
  user?: UserWithRole;
  error?: ProblemDetails;
}> {
  try {
    const currentUser = await getCurrentUser(headersOverride);

    if (!currentUser) {
      return {
        success: false,
        error: problems.authenticationRequired(),
      };
    }

    const hasRequiredRole = await hasRole(minRole, headersOverride);

    if (!hasRequiredRole) {
      return {
        success: false,
        error: problems.insufficientPermission(`Requires role ${minRole} or higher`),
      };
    }

    return {
      success: true,
      user: currentUser,
    };
  } catch (error) {
    logger.error("Error in requireRole", error);
    return {
      success: false,
      error: problems.internalError(),
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
    logger.error("Error checking role management permission", error);
    return false;
  }
}

/**
 * Pure role-assignment rule. Answers one question: given the assigner's
 * role and effective permissions, may they grant `newRole` to someone?
 *
 * - Only a superadmin may grant superadmin.
 * - A superadmin may grant anything else.
 * - Predefined roles follow ROLE_HIERARCHY: the assigner must strictly
 *   outrank the granted role (an admin cannot mint another admin).
 * - Custom roles have no hierarchy position. They are grantable only when
 *   the assigner personally holds every permission the role carries — a
 *   role's permissions can never exceed its grantor's.
 *
 * Callers must resolve `newRolePermissions` first and reject unknown role
 * names before reaching this function (see checkRoleAssignable).
 */
export function canAssignRole(
  assignerRole: Role,
  assignerPermissions: Permission[],
  newRole: Role,
  newRolePermissions: Permission[],
): boolean {
  if (newRole === "superadmin") {
    return assignerRole === "superadmin";
  }

  if (assignerRole === "superadmin") {
    return true;
  }

  if (isPredefinedRole(newRole)) {
    return getRoleLevel(assignerRole) > getRoleLevel(newRole);
  }

  return newRolePermissions.every((permission) => assignerPermissions.includes(permission));
}

/**
 * Pure permission-grant rule for custom-role creation: a role may only be
 * created carrying permissions its creator already holds. Superadmin is
 * exempt because it holds every permission by definition.
 */
export function canGrantPermissions(
  creatorRole: Role,
  creatorPermissions: Permission[],
  requestedPermissions: Permission[],
): boolean {
  if (creatorRole === "superadmin") {
    return true;
  }

  return requestedPermissions.every((permission) => creatorPermissions.includes(permission));
}

export type RoleAssignmentErrorCode = "INVALID_ROLE" | "ROLE_NOT_ASSIGNABLE";

/**
 * Resolve a role name and check it against the assigner's own role and
 * permissions. This is the single gate every role grant must pass —
 * role changes, admin-created users, and bulk updates all route through
 * changeUserRole, which calls this.
 *
 * INVALID_ROLE: the name is neither a predefined role nor an *active*
 * custom role. Granting a dead name would leave the user with a role
 * string that resolves to zero permissions — or worse, silently start
 * granting permissions if a custom role with that name is created later.
 */
export async function checkRoleAssignable(
  assignerId: string,
  newRole: Role,
): Promise<{ valid: true } | { valid: false; error: RoleAssignmentErrorCode }> {
  let newRolePermissions: Permission[];

  if (isPredefinedRole(newRole)) {
    newRolePermissions = ROLE_PERMISSIONS[newRole as PredefinedRole];
  } else {
    const customRoleRecord = await db.query.customRole.findFirst({
      where: (customRoleTable, { eq: eqOp }) => eqOp(customRoleTable.name, newRole),
      columns: { permissions: true, isActive: true },
    });

    if (!customRoleRecord || !customRoleRecord.isActive) {
      return { valid: false, error: "INVALID_ROLE" };
    }

    newRolePermissions = customRoleRecord.permissions as Permission[];
  }

  const assigner = await getUserPermissions(assignerId);

  if (!canAssignRole(assigner.role, assigner.permissions, newRole, newRolePermissions)) {
    return { valid: false, error: "ROLE_NOT_ASSIGNABLE" };
  }

  return { valid: true };
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

    // The assigner must also outrank the *new* role — not just the
    // target's current one. Before this check existed, an admin could
    // promote anyone to superadmin: canManageUserRole only compared the
    // assigner against the target's current role.
    const assignable = await checkRoleAssignable(changedBy, newRole);

    if (!assignable.valid) {
      return {
        success: false,
        error: assignable.error,
      };
    }

    // Lockout guard: never demote the only superadmin. On today's paths
    // this check cannot fire — only a superadmin can demote a superadmin,
    // so two exist while the change runs — but changeUserRole is the
    // single role-mutation gate, and any future caller (self-service
    // demotion, a system process) gets the protection for free.
    if (targetUser.role === "superadmin") {
      const [superadminCount] = await db
        .select({ value: count() })
        .from(user)
        .where(eq(user.role, "superadmin"));

      if (superadminCount.value <= 1) {
        return {
          success: false,
          error: "LAST_SUPERADMIN",
        };
      }
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

    // Drop the target's cached sessions (ENABLE_REDIS_CACHE deployments)
    // so a demotion takes effect immediately instead of after the 60s
    // cache TTL. Best effort: cache misses fall through to the database.
    try {
      await invalidateUserSessionCaches(targetUserId);
    } catch (cacheError) {
      logger.warn("Failed to invalidate session cache after role change", cacheError);
    }

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error changing user role", error);
    return {
      success: false,
      error: "INTERNAL_ERROR",
    };
  }
}

/**
 * True when the user is a superadmin and the only one left. Used as a
 * lockout guard before destructive self-service operations (account
 * deletion): losing the last superadmin locks a deployment out of its
 * own user management permanently, because only a superadmin can grant
 * the superadmin role.
 */
export async function isLastSuperadmin(userId: string): Promise<boolean> {
  const targetUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { role: true },
  });

  if (targetUser?.role !== "superadmin") {
    return false;
  }

  const [superadminCount] = await db
    .select({ value: count() })
    .from(user)
    .where(eq(user.role, "superadmin"));

  return superadminCount.value <= 1;
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
    const { ROLE_DISPLAY_INFO, PREDEFINED_ROLES } = await import("@/types/role");

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
    logger.error("Error getting role statistics", error);
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
    const { ROLE_DISPLAY_INFO, PREDEFINED_ROLES } = await import("@/types/role");

    const roles = PREDEFINED_ROLES.map((role) => ({
      role,
      name: ROLE_DISPLAY_INFO[role].name,
      description: ROLE_DISPLAY_INFO[role].description,
      isPredefined: true,
      userCount: roleUserCounts[role] || 0,
    }));

    const customRoles = await db.query.customRole.findMany({
      where: (customRoleTable, { eq: eqOp }) => eqOp(customRoleTable.isActive, true),
    });

    const customRoleEntries = customRoles.map((customRoleRecord) => ({
      role: customRoleRecord.name,
      name: customRoleRecord.displayName || customRoleRecord.name,
      description: customRoleRecord.description ?? undefined,
      isPredefined: false,
      userCount: roleUserCounts[customRoleRecord.name] || 0,
    }));

    return [...roles, ...customRoleEntries];
  } catch (error) {
    logger.error("Error getting all roles", error);
    return [];
  }
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
      const customRoleRecord = await db.query.customRole.findFirst({
        where: (customRoleTable, { eq: eqOp }) => eqOp(customRoleTable.name, targetUser.role),
        columns: { permissions: true, isActive: true },
      });

      if (customRoleRecord?.isActive) {
        permissions = customRoleRecord.permissions as Permission[];
      }
    }

    return {
      role: targetUser.role as Role,
      permissions,
    };
  } catch (error) {
    logger.error("Error getting user permissions", error);
    return {
      role: "user",
      permissions: [],
    };
  }
}
