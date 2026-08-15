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

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { env } from "@/lib/env";

type DbInstance = PostgresJsDatabase<typeof schema>;
const globalForDb = globalThis as unknown as {
  dbCache: { key: string; db: DbInstance } | undefined;
};

// The cache key includes the schema's export names. Adding a table mid dev
// session re-exports ./schema but used to keep serving the instance whose
// relational `query` map was built from the pre-addition snapshot, so
// `db.query.<newTable>` stayed undefined until a manual server restart.
const schemaKey = Object.keys(schema).sort().join(",");

function createDb(): DbInstance {
  const instance = drizzle(env.DATABASE_URL, {
    schema,
    casing: "snake_case",
  });
  if (env.NODE_ENV !== "production") {
    globalForDb.dbCache = { key: schemaKey, db: instance };
  }
  return instance;
}

export const db =
  globalForDb.dbCache && globalForDb.dbCache.key === schemaKey
    ? globalForDb.dbCache.db
    : createDb();

export { schema };
