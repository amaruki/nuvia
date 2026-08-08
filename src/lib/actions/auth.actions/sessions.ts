"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { clientSafeAuthMessage } from "@/lib/auth/common";
import type { PasswordResetResponse } from "@/types/auth.types";

type SessionList = Awaited<ReturnType<typeof auth.api.listSessions>>;

/**
 * Server action to get user sessions
 */
export async function getUserSessionsAction(): Promise<
  { success: true; data: SessionList } | { success: false; message: string }
> {
  try {
    // Get request headers for authentication
    const requestHeaders = await headers();

    // Use Better Auth API to list sessions
    const sessions = await auth.api.listSessions({
      headers: requestHeaders,
    });

    return {
      success: true,
      data: sessions,
    };
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Failed to get sessions"),
    };
  }
}

/**
 * Server action to revoke a specific session
 */
export async function revokeSessionAction(sessionId: string): Promise<PasswordResetResponse> {
  try {
    // Get request headers for authentication
    const requestHeaders = await headers();

    // Use Better Auth API to revoke session
    await auth.api.revokeSession({
      body: {
        token: sessionId,
      },
      headers: requestHeaders,
    });

    return {
      success: true,
      message: "Session revoked successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Failed to revoke session"),
    };
  }
}

/**
 * Server action to revoke all other sessions
 */
export async function revokeOtherSessionsAction(): Promise<PasswordResetResponse> {
  try {
    // Get request headers for authentication
    const requestHeaders = await headers();

    // Use Better Auth API to revoke other sessions
    await auth.api.revokeOtherSessions({
      headers: requestHeaders,
    });

    return {
      success: true,
      message: "Other sessions revoked successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Failed to revoke other sessions"),
    };
  }
}

/**
 * Server action to revoke all sessions except current one (for session manager)
 */
export async function revokeAllOtherSessionsAction(): Promise<PasswordResetResponse> {
  try {
    // Get request headers for authentication
    const requestHeaders = await headers();

    // Use Better Auth API to revoke other sessions
    await auth.api.revokeOtherSessions({
      headers: requestHeaders,
    });

    return {
      success: true,
      message: "All other sessions revoked successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Failed to revoke other sessions"),
    };
  }
}

/**
 * Server action to sign out
 */
export async function signOutAction(): Promise<PasswordResetResponse> {
  try {
    // Get request headers for authentication
    const requestHeaders = await headers();

    // Use Better Auth API for sign out
    await auth.api.signOut({
      headers: requestHeaders,
    });

    return {
      success: true,
      message: "Signed out successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Sign out failed"),
    };
  }
}

// Export logoutAction for backward compatibility
export const logoutAction = signOutAction;
