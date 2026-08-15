/** Test infrastructure: compose stack, migrations, admin seed, rate-limit flush. */

import { ADMIN_EMAIL, COMPOSE_COMMAND, TEST_ENV } from "./config";
import { Redis } from "ioredis";
import { connect } from "node:net";

import { log, run } from "./helpers";

/** True when something answers on host:port (TCP-level; no protocol talk). */
function portReachable(url: string): Promise<boolean> {
  let host = "";
  let port = 0;
  try {
    const parsed = new URL(url);
    host = parsed.hostname;
    port = Number(parsed.port) || (parsed.protocol === "redis:" ? 6379 : 5432);
  } catch {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const socket = connect({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(2_000, () => socket.destroy());
  });
}

export async function ensureTestStack(): Promise<void> {
  // Contributors (and CI runners with native services) may already run
  // Postgres/Redis on the test ports; `docker compose up` is then
  // redundant and fails outright where no Docker daemon exists. Skip the
  // compose step when both endpoints already answer.
  const [postgresUp, redisUp] = await Promise.all([
    portReachable(TEST_ENV.DATABASE_URL),
    portReachable(TEST_ENV.REDIS_URL),
  ]);
  if (postgresUp && redisUp) {
    log("Test Postgres/Redis already reachable — skipping compose stack.");
  } else {
    log("Ensuring test Postgres/Redis stack is up (compose.yml)…");
    await run([...COMPOSE_COMMAND, "up", "--detach", "--wait"]);
  }
  log("Applying database migrations (drizzle-kit migrate)…");
  await run(["bun", "run", "db:migrate"]);
}

export async function seedAdmin(password: string): Promise<void> {
  log(`Seeding admin accounts (${ADMIN_EMAIL} and role peers)…`);
  await run(["bun", "run", "scripts/seed.ts"], { SEED_ADMIN_PASSWORD: password });
}

/**
 * Rate limiting is Redis-backed and keyed by IP + route (ADR-0003), so
 * repeated smoke runs accumulate hits in the shared test Redis and
 * eventually trip the 100-requests/15-minutes API backstop mid-audit. UI-10
 * doubled the traffic (light + dark passes), so main.ts flushes once before
 * sign-in and again before every audited page (quietly); when the gate
 * reuses a server without REDIS_URL the limiter is off and flushing is a
 * harmless no-op against the dedicated test Redis.
 */
export async function flushRateLimitState(quiet: boolean = false): Promise<void> {
  if (!quiet) {
    log("Flushing test Redis so stale rate-limit buckets cannot taint the audit…");
  }
  const redis = new Redis(TEST_ENV.REDIS_URL, { maxRetriesPerRequest: 3 });
  try {
    await redis.flushdb();
  } finally {
    redis.disconnect();
  }
}
