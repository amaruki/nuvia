"use server";

import { validateSessionWithCache } from "@/lib/session-cache";
import { cookies } from "next/headers";

/**
 * Server action to get session with caching
 * This can be used in server components for fast session validation
 */
export async function getSessionWithCache() {
  try {
    const cookieStore = cookies();
    const sessionToken = (await cookieStore).get("better-auth.session_token")?.value;

    if (!sessionToken) {
      return null;
    }

    return await validateSessionWithCache(sessionToken);
  } catch (error) {
    console.error("Error getting cached session:", error);
    return null;
  }
}

/**
 * Server action to invalidate user's session cache
 * Useful after logout or session updates
 */
export async function invalidateUserSessionCache() {
  try {
    const cookieStore = cookies();
    const sessionToken = (await cookieStore).get("better-auth.session_token")?.value;

    if (sessionToken) {
      const { invalidateSessionCache } = await import("@/lib/session-cache");
      await invalidateSessionCache(sessionToken);
    }
  } catch (error) {
    console.error("Error invalidating session cache:", error);
  }
}