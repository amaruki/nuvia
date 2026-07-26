/**
 * Drizzle database client, backed by Bun's native SQL driver
 * (drizzle-orm/bun-sql — no separate `pg` dependency needed).
 *
 * Replaces src/lib/prisma.ts. Every file that used to do
 * `import { prisma } from '@/lib/prisma'` now does
 * `import { db } from '@/db/client'`.
 */

import { drizzle } from "drizzle-orm/bun-sql";
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
