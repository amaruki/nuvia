/**
 * Permission checks.
 *
 * Session-relative permission predicates (has*) and the permission-level
 * authorization gate (requirePermission) used by API routes and server
 * actions per ADR-0001.
 */

import { problems, type ProblemDetails } from "@/lib/http";
import { logger } from "@/lib/logger";
import { Permission } from "@/types/role";
import { getCurrentUser } from "./current-user";
import type { UserWithRole } from "./types";

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
