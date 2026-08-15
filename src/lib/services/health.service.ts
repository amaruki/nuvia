/**
 * Liveness/readiness probe for orchestrators (Docker HEALTHCHECK, load
 * balancers, uptime monitors) — docs/DEPLOYMENT_PLAN.md §Health checks.
 *
 * Deliberately separate from system-database.service.ts and
 * system-cache.service.ts: those serve the dashboard tools pages with
 * heavy diagnostics (row counts, migration state, configuration facts).
 * A probe must stay one cheap `select 1` and one `PING` — nothing an
 * orchestrator polls every five seconds should run aggregate queries.
 *
 * Honesty contract (same as UI-23): the probe reports what it observed.
 * It never claims "healthy" without a round-trip. Error details are NOT
 * returned — an orchestrator needs the boolean, an attacker probing the
 * endpoint does not need the connection error.
 */

import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import { getCacheSystemStatus } from "@/lib/services/system-cache.service";

const PROBE_TIMEOUT_MS = 3_000;

export interface DependencyCheck {
  /** The probe round-trip succeeded within the timeout. */
  reachable: boolean;
}

export interface HealthStatus {
  /** "ok" only when every dependency below is reachable. */
  status: "ok" | "degraded";
  checks: {
    database: DependencyCheck;
    redis: DependencyCheck;
  };
}

async function probeDatabase(): Promise<DependencyCheck> {
  try {
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("database probe timed out")), PROBE_TIMEOUT_MS),
      ),
    ]);
    return { reachable: true };
  } catch {
    return { reachable: false };
  }
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const [database, cacheStatus] = await Promise.all([probeDatabase(), getCacheSystemStatus()]);

  const redis: DependencyCheck = {
    // Redis is required in production (src/lib/env.ts refuses to boot
    // without REDIS_URL there), so an unconfigured Redis is "reachable:
    // false" for probe purposes — the boot guard already covers dev.
    reachable: cacheStatus.redis.configured && cacheStatus.redis.reachable,
  };

  return {
    status: database.reachable && redis.reachable ? "ok" : "degraded",
    checks: { database, redis },
  };
}
