"use server";

import { headers } from "next/headers";
import { AuthUtils } from "@/lib/auth/utils";
import { auth } from "@/lib/auth";
import { clientSafeAuthMessage } from "@/lib/auth/common";
import { logger } from "@/lib/logger";
import type { AuthResponse, SafeUser } from "@/types/auth.types";

import { transformUserToSafeUser, type AuthUserSource } from "./mappers";

/**
 * Server action to get current user
 */
export async function getCurrentUserAction(): Promise<{
  success: boolean;
  data?: SafeUser;
  error?: string;
}> {
  try {
    const user = await AuthUtils.getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    return {
      success: true,
      data: transformUserToSafeUser(user),
    };
  } catch (error) {
    return {
      success: false,
      error: clientSafeAuthMessage(error, "Failed to get current user"),
    };
  }
}

/**
 * Server action to update user profile
 */
export async function updateProfileAction(formData: FormData): Promise<AuthResponse> {
  try {
    // Extract form data
    const displayName = formData.get("displayName") as string;
    const bio = formData.get("bio") as string;
    const profilePhoto = formData.get("profilePhoto") as string;
    const externalLinksStr = formData.get("externalLinks") as string;

    // Parse externalLinks if provided
    let externalLinks;
    if (externalLinksStr) {
      try {
        externalLinks = JSON.parse(externalLinksStr);
      } catch (parseError) {
        logger.warn("Failed to parse externalLinks", parseError);
        externalLinks = null;
      }
    }

    // Get request headers for authentication
    const requestHeaders = await headers();

    // Prepare update body
    const updateBody: {
      name?: string;
      bio?: string;
      image?: string;
      externalLinks?: Record<string, unknown> | null;
    } = {
      name: displayName || undefined,
      bio: bio || undefined,
      image: profilePhoto || undefined,
    };

    // Only include externalLinks if it was provided
    if (externalLinks !== undefined) {
      updateBody.externalLinks = externalLinks;
    }

    // Use Better Auth API for profile update
    const updatedUser = await auth.api.updateUser({
      body: updateBody,
      headers: requestHeaders,
    });

    return {
      success: true,
      message: "Profile updated successfully",
      data: {
        // better-auth's updateUser returns `{ status: true }`, not the updated
        // user; the legacy action mapped that object through `any` anyway, so
        // the cast keeps behavior identical.
        user: transformUserToSafeUser(updatedUser as unknown as AuthUserSource),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Profile update failed"),
    };
  }
}
