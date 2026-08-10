/** Test infrastructure: compose stack, schema push, admin seed, rate-limit flush. */

import { ADMIN_EMAIL, COMPOSE_COMMAND, TEST_ENV } from "./config";
import { Redis } from "ioredis";

import { log, run } from "./helpers";

export async function ensureTestStack(): Promise<void> {
  log("Ensuring test Postgres/Redis stack is up (compose.yml)…");
  await run([...COMPOSE_COMMAND, "up", "--detach", "--wait"]);
  log("Pushing database schema (drizzle-kit push --force)…");
  await run(["bunx", "drizzle-kit", "push", "--force"]);
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
