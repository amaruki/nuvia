/**
 * Session helpers: reading the active session/user, enforcing authentication,
 * and signing out.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { AuthError, AuthErrorType, clientSafeAuthMessage } from "../common";
import { logger } from "@/lib/logger";
import { SafeUser } from "@/types/auth.types";
import type { AuthResult, Session } from "./types";

/**
 * Get the current session from the request
 */
export async function getSession(request?: NextRequest): Promise<Session | null> {
  try {
    if (request) {
      // For API routes and server actions with request
      return await auth.api.getSession({
        headers: request.headers,
      });
    } else {
      // For server components and middleware
      const headerList = await headers();
      return await auth.api.getSession({
        headers: headerList,
      });
    }
  } catch (error) {
    logger.error("Error getting session", error);
    return null;
  }
}

/**
 * Get the current user from the session
 */
export async function getCurrentUser(request?: NextRequest): Promise<SafeUser | null> {
  try {
    const session = await getSession(request);
    return session?.user || null;
  } catch (error) {
    logger.error("Error getting current user", error);
    return null;
  }
}

/**
 * Get the current user ID
 */
export async function getCurrentUserId(request?: NextRequest): Promise<string | null> {
  try {
    const user = await getCurrentUser(request);
    return user?.id || null;
  } catch (error) {
    logger.error("Error getting current user ID", error);
    return null;
  }
}

/**
 * Check if a user is authenticated
 */
export async function isAuthenticated(request?: NextRequest): Promise<boolean> {
  try {
    const session = await getSession(request);
    return !!session && !!session.user;
  } catch (error) {
    logger.error("Error checking authentication", error);
    return false;
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(request?: NextRequest): Promise<SafeUser> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new AuthError(AuthErrorType.AUTHENTICATION, "Authentication required");
  }

  return user;
}

/**
 * Sign out current user
 */
export async function signOut(request?: NextRequest): Promise<AuthResult<void>> {
  try {
    // Use Better Auth API to sign out
    await auth.api.signOut({
      headers: request?.headers || (await headers()),
    });

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: clientSafeAuthMessage(error, "Sign out failed"),
    };
  }
}

/**
 * Convenience function to get current session
 */
export const getCurrentSession = getSession;
