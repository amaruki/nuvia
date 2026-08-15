/**
 * Runtime migration applier — applies `drizzle/` migrations using only
 * drizzle-orm (a production dependency), so a deploy container does not
 * need drizzle-kit (a devDependency) or its CLI.
 *
 * Usage in a deployment pipeline (before starting the app):
 *
 *   DATABASE_URL=... bun run scripts/db-migrate.ts
 *
 * Local development keeps using `bun run db:migrate` (drizzle-kit) — this
 * script exists for the deploy path and produces the same end state:
 * both write to the same `drizzle.__drizzle_migrations` ledger, so mixing
 * them is safe.
 *
 * Connects to whatever DATABASE_URL points at. Never point it at a
 * database you do not intend to migrate.
 */

import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { drizzle } from "drizzle-orm/postgres-js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL must be set to apply migrations.");
  process.exit(1);
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  await client.end({ timeout: 5 });
}
