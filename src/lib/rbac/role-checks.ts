/**
 * Role checks.
 *
 * Session-relative role predicates (hasRole), the role-level authorization
 * gate (requireRole) per ADR-0001, and the manager-versus-target role
 * comparison used by role mutations.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { problems, type ProblemDetails } from "@/lib/http";
import { logger } from "@/lib/logger";
import { PredefinedRole, Role, canManageRole, getRoleLevel } from "@/types/role";
import { getCurrentUser } from "./current-user";
import type { UserWithRole } from "./types";

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
