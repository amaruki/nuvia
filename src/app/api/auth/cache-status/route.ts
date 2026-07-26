import { NextResponse } from "next/server";
import { getCacheStatus } from "@/lib/session-cache";

export async function GET() {
  try {
    const status = getCacheStatus();

    return NextResponse.json({
      success: true,
      data: {
        sessionCache: {
          enabled: status.enabled,
          mode: status.enabled ? "redis" : "database-only",
          performance: status.enabled
            ? "Optimized with Redis caching"
            : "Standard performance (client-side cache only)",
        },
        redis: status.redis,
        optimizations: {
          databaseIndexes: "Applied ✅",
          clientSideCache: "30-second TTL ✅",
          connectionPooling: "Enabled ✅",
          redisCache: status.enabled ? "60-second TTL ✅" : "Disabled ❌",
        },
        configuration: {
          envVariables: {
            ENABLE_REDIS_CACHE: process.env.ENABLE_REDIS_CACHE || "false",
            NEXT_PUBLIC_ENABLE_REDIS_CACHE: process.env.NEXT_PUBLIC_ENABLE_REDIS_CACHE || "false",
            REDIS_URL: process.env.REDIS_URL ? "***configured***" : "not set",
          },
        },
      },
    });
  } catch (error) {
    console.error("Error getting cache status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
