/**
 * Profile helpers: updating the current user's profile.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { AuthError, AuthErrorType, clientSafeAuthMessage } from "../common";
import { SafeUser } from "@/types/auth.types";
import { getSession } from "./session";
import type { AuthResult, ProfileUpdateData } from "./types";

/**
 * Update user profile
 */
export async function updateProfile(
  data: ProfileUpdateData,
  request?: NextRequest,
): Promise<AuthResult<SafeUser>> {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      throw new AuthError(AuthErrorType.AUTHENTICATION, "Must be authenticated to update profile");
    }

    const result = await auth.api.updateUser({
      headers: request?.headers || (await headers()),
      body: {
        name: data.name,
        image: data.image || undefined,
        externalLinks: data.externalLinks === null ? null : undefined,
      },
    });

    return {
      success: true,
      // better-auth's updateUser returns `{ status: true }`, not the updated
      // user, and callers read `.status` off the result — pass it through
      // untouched, as the legacy `as any` cast did.
      data: result as unknown as SafeUser,
    };
  } catch (error) {
    return {
      success: false,
      error: clientSafeAuthMessage(error, "Profile update failed"),
    };
  }
}
