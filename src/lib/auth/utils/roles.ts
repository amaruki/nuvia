/**
 * Role validators: authorization checks against the current user.
 */

import { NextRequest } from "next/server";
import { AuthError, AuthErrorType } from "../common";
import { logger } from "@/lib/logger";
import { SafeUser } from "@/types/auth.types";
import { getCurrentUser, requireAuth } from "./session";

/**
 * Check if user has specific role
 */
export async function hasRole(role: string, request?: NextRequest): Promise<boolean> {
  try {
    const user = await getCurrentUser(request);
    return user?.role === role;
  } catch (error) {
    logger.error("Error checking user role", error);
    return false;
  }
}

/**
 * Require specific role - throws error if user doesn't have role
 */
export async function requireRole(role: string, request?: NextRequest): Promise<SafeUser> {
  const user = await requireAuth(request);

  if (user.role !== role) {
    throw new AuthError(AuthErrorType.AUTHORIZATION, `Access denied. Required role: ${role}`);
  }

  return user;
}
