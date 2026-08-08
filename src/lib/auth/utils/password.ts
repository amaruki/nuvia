/**
 * Password helpers: changing the current user's password. Actual hashing and
 * verification are handled internally by Better Auth.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { AuthError, AuthErrorType, clientSafeAuthMessage } from "../common";
import { getSession } from "./session";
import type { AuthResult, PasswordChangeData } from "./types";

/**
 * Change user password
 */
export async function changePassword(
  data: PasswordChangeData,
  request?: NextRequest,
): Promise<AuthResult<void>> {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      throw new AuthError(AuthErrorType.AUTHENTICATION, "Must be authenticated to change password");
    }

    await auth.api.changePassword({
      headers: request?.headers || (await headers()),
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      },
    });

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: clientSafeAuthMessage(error, "Password change failed"),
    };
  }
}
