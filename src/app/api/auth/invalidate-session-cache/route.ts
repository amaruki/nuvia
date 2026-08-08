import { NextRequest } from "next/server";
import { invalidateUserSessionCaches } from "@/lib/session-cache";
import { auth } from "@/lib/auth";
import { problemResponse, problems, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";

/**
 * POST /api/auth/invalidate-session-cache — drop the caller's own cached
 * sessions.
 *
 * Hardened from the original version, which accepted a client-supplied
 * token and invalidated that exact key: any authenticated user could
 * evict any other user's cached session (a denial of the cache for
 * whoever they targeted). The body is now ignored and the server
 * invalidates by the caller's verified user id instead, so a user can
 * only ever clear their own entries.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return problemResponse(problems.authenticationRequired());
    }

    await invalidateUserSessionCaches(session.user.id);

    return successResponse(null, { message: "Session cache invalidated" });
  } catch (error) {
    logger.error("Error invalidating session cache", error);
    return problemResponse(problems.internalError());
  }
}
