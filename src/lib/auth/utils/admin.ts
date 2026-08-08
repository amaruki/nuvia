/**
 * Admin helpers: user lookup, listing, and role management. These operations
 * require the admin role and, in most Better Auth configurations, database
 * access through the manager layer.
 */

import { NextRequest } from "next/server";
import { AuthError, AuthErrorType, clientSafeAuthMessage } from "../common";
import { SafeUser } from "@/types/auth.types";
import { requireRole } from "./roles";
import type { AuthResult } from "./types";

/**
 * Get user by ID (admin function)
 */
export async function getUserById(
  userId: string,
  request?: NextRequest,
): Promise<AuthResult<SafeUser>> {
  try {
    // Verify requester is admin
    await requireRole("admin", request);

    // Note: Better Auth typically doesn't expose a direct getUserById API in most configurations
    // This would usually require database access through the adapter or manager layer
    // For a real implementation, you would use your database manager layer:

    throw new AuthError(
      AuthErrorType.NOT_FOUND,
      `User lookup requires database access. User ID: ${userId}. Use your manager layer for database operations.`,
    );
  } catch (error) {
    return {
      success: false,
      error: clientSafeAuthMessage(error, "Failed to get user"),
    };
  }
}

/**
 * List users (admin function)
 */
export async function listUsers(
  options?: { limit?: number; offset?: number },
  request?: NextRequest,
): Promise<AuthResult<SafeUser[]>> {
  try {
    // Verify requester is admin
    await requireRole("admin", request);

    // Note: Better Auth typically doesn't expose a direct listUsers API in most configurations
    // This would require database access through the adapter or manager layer
    // For a real implementation, you would use your database manager layer with pagination

    throw new AuthError(
      AuthErrorType.NOT_FOUND,
      `User listing requires database access. Use your manager layer for database operations with pagination.`,
    );
  } catch (error) {
    return {
      success: false,
      error: clientSafeAuthMessage(error, "Failed to list users"),
    };
  }
}

/**
 * Update user role (admin function)
 */
export async function updateUserRole(
  userId: string,
  role: string,
  request?: NextRequest,
): Promise<AuthResult<SafeUser>> {
  try {
    // Verify requester is admin
    await requireRole("admin", request);

    // Note: Better Auth typically doesn't expose a direct updateUserRole API in most configurations
    // This would require database access through the adapter or manager layer
    // For a real implementation, you would use your database manager layer:

    throw new AuthError(
      AuthErrorType.NOT_FOUND,
      `User role update requires database access. User ID: ${userId}, Role: ${role}. Use your manager layer for database operations.`,
    );
  } catch (error) {
    return {
      success: false,
      error: clientSafeAuthMessage(error, "Failed to update user role"),
    };
  }
}
