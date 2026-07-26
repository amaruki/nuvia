/**
 * Drizzle database client, backed by postgres.js
 * (drizzle-orm/postgres-js), not Bun's native SQL driver.
 *
 * drizzle-orm/bun-sql unconditionally imports the `bun` built-in module,
 * which doesn't exist in the plain Node.js child processes Next.js's
 * `next build` spawns to collect route/page data (jest-worker forks a
 * real `node` process for this regardless of which runtime launched the
 * parent `next build` — confirmed with both Turbopack and webpack) —
 * that broke `bun run build` outright for every route importing this
 * module. postgres.js runs the same under Bun and Node.
 *
 * Replaces src/lib/prisma.ts. Every file that used to do
 * `import { prisma } from '@/lib/prisma'` now does
 * `import { db } from '@/db/client'`.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { env } from "@/lib/env";

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

export const db =
  globalForDb.db ??
  drizzle(env.DATABASE_URL, {
    schema,
    casing: "snake_case",
  });

if (env.NODE_ENV !== "production") globalForDb.db = db;

export { schema };
