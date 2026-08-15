import { NextRequest } from "next/server";
import { cacheSession } from "@/lib/session-cache";
import { auth } from "@/lib/auth";
import { problemResponse, problems, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";

// Session-dependent by definition — and without this Next.js tries to
// collect the route statically at build time, evaluating env.ts (which
// refuses to boot without a valid BETTER_AUTH_SECRET) before any request
// exists. Same class as the force-dynamic (public) DB-backed pages.
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/cache-session — warm the Redis session cache for the
 * caller's own session.
 *
 * Hardened from the original version, which accepted a client-supplied
 * token and sessionData body: any authenticated user could plant a
 * forged identity under any session token, and validateSessionWithCache
 * trusts whatever it finds there. The body is now ignored entirely — the
 * server derives both the token and the cached payload from the caller's
 * verified session, so a user can only ever cache themselves.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return problemResponse(problems.authenticationRequired());
    }

    await cacheSession(session.session.token, {
      id: session.session.id,
      userId: session.user.id,
      expiresAt: session.session.expiresAt,
      user: {
        id: session.user.id,
        email: session.user.email,
        username: (session.user as { username?: string }).username ?? session.user.name,
        name: session.user.name,
        image: session.user.image,
      },
    });

    return successResponse(null, { message: "Session cached" });
  } catch (error) {
    logger.error("Error caching session", error);
    return problemResponse(problems.internalError());
  }
}
