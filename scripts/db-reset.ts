/**
 * Development-only wipe behind `db:reset`: drops and recreates the `public`
 * schema so `db:migrate` can reapply the tracked migrations to a clean
 * database (the chain is completed by `db:migrate` and `db:seed` in
 * package.json).
 *
 * This is safe today because no production data exists — see
 * docs/release.md ("Migration compatibility") for the transition point at
 * which this workflow stops being safe and expand/contract discipline takes
 * over. It connects to whatever DATABASE_URL is set, so never point it at a
 * database you care about.
 */
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set to reset the database (see .env.example).");
}

const sql = postgres(databaseUrl, { max: 1 });

// Drop the ledger schema too (drizzle-kit keeps `__drizzle_migrations` in
// its own `drizzle` schema); an old ledger would make the follow-up
// `db:migrate` skip migrations that the wiped `public` schema now needs.
await sql.unsafe("drop schema if exists drizzle cascade");
await sql.unsafe("drop schema public cascade");
await sql.unsafe("create schema public");
await sql.unsafe("grant all on schema public to public");

await sql.end();
