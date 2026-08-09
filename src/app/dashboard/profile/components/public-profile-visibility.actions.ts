"use server";

/**
 * Server actions behind the public-profile visibility toggle (UI-28,
 * decision D7). Persistence goes through the same better-auth profile
 * update path the other profile fields use (`auth.api.updateUser`); the
 * read goes straight to the users table so the toggle always reflects the
 * persisted truth rather than a possibly-stale session snapshot.
 */

import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { clientSafeAuthMessage } from "@/lib/auth/common";
import { AuthUtils } from "@/lib/auth/utils";
import { logger } from "@/lib/logger";

export interface VisibilityActionResult {
  success: boolean;
  profilePublic?: boolean;
  error?: string;
}

export async function getProfileVisibilityAction(): Promise<VisibilityActionResult> {
  try {
    const currentUser = await AuthUtils.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "User not authenticated" };
    }

    const [row] = await db
      .select({ profilePublic: user.profilePublic })
      .from(user)
      .where(eq(user.id, currentUser.id));

    if (!row) {
      return { success: false, error: "User not found" };
    }

    return { success: true, profilePublic: row.profilePublic };
  } catch (error) {
    logger.error("Failed to read profile visibility", error);
    return {
      success: false,
      error: clientSafeAuthMessage(error, "Failed to load the visibility setting"),
    };
  }
}

export async function setProfileVisibilityAction(
  profilePublic: boolean,
): Promise<VisibilityActionResult> {
  try {
    const currentUser = await AuthUtils.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "User not authenticated" };
    }

    const requestHeaders = await headers();
    await auth.api.updateUser({
      body: { profilePublic },
      headers: requestHeaders,
    });

    return { success: true, profilePublic };
  } catch (error) {
    logger.error("Failed to update profile visibility", error);
    return {
      success: false,
      error: clientSafeAuthMessage(error, "Failed to update the visibility setting"),
    };
  }
}
