/**
 * Role queries.
 *
 * Read-only role/permission lookups against the database: effective
 * permissions for a user, the full role catalog for UI display, and role
 * statistics for the dashboard.
 */

import { count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { logger } from "@/lib/logger";
import { PredefinedRole, Permission, ROLE_PERMISSIONS, Role, isPredefinedRole } from "@/types/role";

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
