import { getCacheStatus } from "@/lib/session-cache";
import { requirePermission } from "@/lib/rbac";
import { problemResponse, problems, successResponse } from "@/lib/http";
import { logger } from "@/lib/logger";

// Per-request diagnostics — and without this Next.js collects the
// handler-less route statically at build time, evaluating env.ts before
// any request exists.
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/cache-status — session-cache diagnostics.
 *
 * Hardened from the original version, which answered for any caller and
 * described deployment internals (whether Redis caching is on, whether
 * REDIS_URL is set). It now requires the system:read permission — the
 * same gate the rest of the system-administration surface uses — so
 * deployment configuration is only visible to operators.
 */
export async function GET() {
  try {
    const auth = await requirePermission("system:read");

    if (!auth.success) {
      return problemResponse(auth.error!);
    }

    const status = getCacheStatus();

    return successResponse({
      sessionCache: {
        enabled: status.enabled,
        mode: status.enabled ? "redis" : "database-only",
      },
      redis: status.redis,
    });
  } catch (error) {
    logger.error("Error getting cache status", error);
    return problemResponse(problems.internalError());
  }
}
