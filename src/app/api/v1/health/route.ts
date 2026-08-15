import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { getHealthStatus } from "@/lib/services/health.service";

// A probe must run per request — never prerendered into the build (it
// takes no Request argument, so Next.js would otherwise treat it as
// static and run it at build time).
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/health — deployment probe (docs/DEPLOYMENT_PLAN.md).
 *
 * Anonymous by design: it is listed in proxy.ts's public endpoint list so
 * orchestrators without credentials can poll it. Returns only dependency
 * reachability booleans — no versions, no configuration, no error details
 * (see health.service.ts's honesty contract for why).
 *
 * HTTP semantics for orchestrators: 200 when every dependency is
 * reachable, 503 otherwise. Both carry the same JSON body; the status
 * code is what Docker HEALTHCHECK and load balancers consume.
 */
export async function GET() {
  try {
    const health = await getHealthStatus();

    if (health.status !== "ok") {
      logger.warn("Health probe degraded", {
        database: health.checks.database.reachable,
        redis: health.checks.redis.reachable,
      });
    }

    return NextResponse.json(health, { status: health.status === "ok" ? 200 : 503 });
  } catch (error) {
    // A probe that throws must still answer like a probe.
    logger.error("Health probe error", error);
    return NextResponse.json(
      {
        status: "degraded",
        checks: { database: { reachable: false }, redis: { reachable: false } },
      },
      { status: 503 },
    );
  }
}
