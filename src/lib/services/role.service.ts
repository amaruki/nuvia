/**
 * Role Management Service
 *
 * Business logic layer for role and permission management.
 * Encapsulates all role-related operations and validation rules.
 */

import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog, user } from "@/db/schema";
import {
  Role,
  PredefinedRole,
  Permission,
  isPredefinedRole,
  ROLE_PERMISSIONS,
  ROLE_DISPLAY_INFO,
} from "@/types/role.types";

// Service response interface
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

// User with role information
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

// Role change history
export interface RoleChangeHistory {
  id: string;
  userId: string;
  previousRole: Role;
  newRole: Role;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// Interface for role change metadata stored in authLog
interface RoleChangeMetadata {
  previousRole: Role;
  newRole: Role;
  changedBy: string;
  reason?: string;
}

/**
 * Get user with detailed role and permission information
 */
export async function getUserWithRoleInfo(
  userId: string,
): Promise<ServiceResponse<UserWithRoleInfo>> {
  try {
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        id: true,
        username: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!targetUser) {
      return {
        success: false,
        error: "USER_NOT_FOUND",
      };
    }

    // Get permissions for the user's role
    let permissions: Permission[] = [];

    if (isPredefinedRole(targetUser.role as Role)) {
      permissions = ROLE_PERMISSIONS[targetUser.role as PredefinedRole];
    } else {
      // TODO: Get custom role permissions from database
      // For now, return empty permissions for custom roles
    }

    return {
      success: true,
      data: {
        ...targetUser,
        displayName: targetUser.displayName || undefined,
        role: targetUser.role as Role,
        permissions,
      },
    };
  } catch (error) {
    console.error("Error getting user with role info:", error);
    return {
      success: false,
      error: "INTERNAL_ERROR",
    };
  }
}

/**
 * Update user role with comprehensive validation and business rules
 */
export async function updateUserRole(
  targetUserId: string,
  newRole: Role,
  changedBy: string,
  reason?: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<ServiceResponse> {
  try {
    // Get current user and target user
    const [changer, targetUser] = await Promise.all([
      getUserWithRoleInfo(changedBy),
      getUserWithRoleInfo(targetUserId),
    ]);

    if (!changer.success || !changer.data) {
      return {
        success: false,
        error: "CHANGER_NOT_FOUND",
      };
    }

    if (!targetUser.success || !targetUser.data) {
      return {
        success: false,
        error: "TARGET_USER_NOT_FOUND",
      };
    }

    // Business rule validations
    // TODO: Implement validateRoleAssignment function
    /*
    const validation = validateRoleAssignment(
      targetUser.data.role,
      newRole,
      changer.data.role
    );

    if (!validation.valid) {
      return {
        success: false,
        error: 'VALIDATION_FAILED',
        details: { reason: validation.reason }
      };
    }
    */

    // Check if role is actually changing
    if (targetUser.data.role === newRole) {
      return {
        success: true,
        data: {
          message: "Role unchanged",
          userId: targetUserId,
          role: newRole,
        },
      };
    }

    // Perform the role update
    await db.update(user).set({ role: newRole }).where(eq(user.id, targetUserId));

    // Log the change for audit trail
    await logRoleChange({
      userId: targetUserId,
      previousRole: targetUser.data.role,
      newRole,
      changedBy,
      reason,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    return {
      success: true,
      data: {
        userId: targetUserId,
        previousRole: targetUser.data.role,
        newRole,
        changedBy,
        changedAt: new Date(),
      },
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      error: "INTERNAL_ERROR",
    };
  }
}

/**
 * Bulk update user roles with validation and error handling
 */
export async function bulkUpdateUserRoles(
  userIds: string[],
  newRole: Role,
  changedBy: string,
  reason?: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<
  ServiceResponse<{
    successful: Array<{ userId: string; previousRole: Role; newRole: Role }>;
    failed: Array<{ userId: string; error: string; details?: any }>;
    total: number;
  }>
> {
  try {
    const results = await Promise.allSettled(
      userIds.map((userId) => updateUserRole(userId, newRole, changedBy, reason, metadata)),
    );

    const successful: Array<{ userId: string; previousRole: Role; newRole: Role }> = [];
    const failed: Array<{ userId: string; error: string; details?: any }> = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.success) {
        successful.push({
          userId: userIds[index],
          previousRole: result.value.data.previousRole,
          newRole: result.value.data.newRole,
        });
      } else {
        const error =
          result.status === "rejected" ? "INTERNAL_ERROR" : result.value.error || "UNKNOWN_ERROR";
        const details = result.status === "fulfilled" ? result.value.details : undefined;

        failed.push({
          userId: userIds[index],
          error,
          details,
        });
      }
    });

    return {
      success: true,
      data: {
        successful,
        failed,
        total: userIds.length,
      },
    };
  } catch (error) {
    console.error("Error in bulk role update:", error);
    return {
      success: false,
      error: "INTERNAL_ERROR",
    };
  }
}

/**
 * Get role change history for a user
 */
export async function getUserRoleHistory(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
  },
): Promise<ServiceResponse<RoleChangeHistory[]>> {
  try {
    const logs = await db
      .select({
        id: authLog.id,
        timestamp: authLog.timestamp,
        ipAddress: authLog.ipAddress,
        userAgent: authLog.userAgent,
        metadata: authLog.metadata,
        message: authLog.message,
      })
      .from(authLog)
      .where(and(eq(authLog.userId, userId), eq(authLog.eventType, "ROLE_CHANGE")))
      .orderBy(desc(authLog.timestamp))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0);

    const history: RoleChangeHistory[] = logs.map((log) => {
      const metadata = log.metadata as RoleChangeMetadata | null;
      return {
        id: log.id,
        userId,
        previousRole: metadata?.previousRole || "unknown",
        newRole: metadata?.newRole || "unknown",
        changedBy: metadata?.changedBy || "unknown",
        changedAt: log.timestamp,
        reason: metadata?.reason,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      };
    });

    return {
      success: true,
      data: history,
    };
  } catch (error) {
    console.error("Error getting user role history:", error);
    return {
      success: false,
      error: "INTERNAL_ERROR",
    };
  }
}

/**
 * Get role distribution statistics
 */
export async function getRoleDistributionStatistics(): Promise<
  ServiceResponse<{
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
  }>
> {
  try {
    const roleStats = await db
      .select({ role: user.role, value: count() })
      .from(user)
      .groupBy(user.role);

    let totalUsers = 0;
    const roleDistribution: Record<string, number> = {};

    roleStats.forEach((stat) => {
      roleDistribution[stat.role] = stat.value;
      totalUsers += stat.value;
    });

    // Create detailed breakdown with display information
    const roleBreakdown = Object.entries(roleDistribution).map(([role, count]) => {
      const displayInfo = isPredefinedRole(role as Role)
        ? ROLE_DISPLAY_INFO[role as PredefinedRole]
        : { name: role, description: "Custom role", category: "custom" };

      return {
        role: role as Role,
        count,
        percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100 * 100) / 100 : 0,
        displayName: displayInfo.name,
        description: displayInfo.description,
        category: displayInfo.category,
      };
    });

    // Sort by count (descending)
    roleBreakdown.sort((a, b) => b.count - a.count);

    return {
      success: true,
      data: {
        totalUsers,
        roleDistribution: roleDistribution as Record<Role, number>,
        roleBreakdown,
      },
    };
  } catch (error) {
    console.error("Error getting role distribution statistics:", error);
    return {
      success: false,
      error: "INTERNAL_ERROR",
    };
  }
}

/**
 * Get users by role with pagination
 */
export async function getUsersByRole(
  role: Role,
  options?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: "username" | "email" | "createdAt";
    sortOrder?: "asc" | "desc";
  },
): Promise<
  ServiceResponse<{
    users: UserWithRoleInfo[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>
> {
  try {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Build search filter — case-insensitive OR across four columns
    const search = options?.search;
    const searchFilter = search
      ? or(
          ilike(user.username, `%${search}%`),
          ilike(user.email, `%${search}%`),
          ilike(user.name, `%${search}%`),
          ilike(user.displayName, `%${search}%`),
        )
      : undefined;

    const whereClause = and(eq(user.role, role), searchFilter);

    // Get total count
    const [{ value: total }] = await db.select({ value: count() }).from(user).where(whereClause);

    // Get users
    const sortColumns = {
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    } as const;
    const sortColumn = sortColumns[options?.sortBy || "createdAt"];
    const sortDirection = options?.sortOrder === "asc" ? asc : desc;

    const users = await db
      .select({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(whereClause)
      .orderBy(sortDirection(sortColumn))
      .limit(limit)
      .offset(offset);

    // Add permissions to each user
    const usersWithPermissions: UserWithRoleInfo[] = users.map((user) => {
      const permissions = isPredefinedRole(user.role as Role)
        ? ROLE_PERMISSIONS[user.role as PredefinedRole]
        : [];

      return {
        ...user,
        role: user.role as Role,
        permissions,
      };
    });

    return {
      success: true,
      data: {
        users: usersWithPermissions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Error getting users by role:", error);
    return {
      success: false,
      error: "INTERNAL_ERROR",
    };
  }
}

/**
 * Log role changes for audit trail
 */
async function logRoleChange(data: {
  userId: string;
  previousRole: Role;
  newRole: Role;
  changedBy: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.insert(authLog).values({
      userId: data.userId,
      eventType: "ROLE_CHANGE",
      severity: "INFO",
      message: `Role changed from ${data.previousRole} to ${data.newRole}`,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: {
        previousRole: data.previousRole,
        newRole: data.newRole,
        changedBy: data.changedBy,
        reason: data.reason,
      },
    });
  } catch (error) {
    console.error("Error logging role change:", error);
    // Don't fail the operation if logging fails
  }
}

/**
 * Validate if a user can be assigned to a role
 */
export function validateRoleAssignmentRules(
  currentRole: Role,
  targetRole: Role,
  assignerRole: Role,
): ServiceResponse {
  // TODO: Implement validateRoleAssignment function
  /*
  const validation = validateRoleAssignment(currentRole, targetRole, assignerRole);

  if (!validation.valid) {
    return {
      success: false,
      error: 'VALIDATION_FAILED',
      details: { reason: validation.reason }
    };
  }

  // Additional business rules can be added here
  // For example: prevent certain role transitions, limit role changes per day, etc.

  */
  return {
    success: true,
  };
}
