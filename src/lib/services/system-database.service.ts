/**
 * Read-only database health for the tools/database page (UI-23/D3).
 *
 * Honesty contract: every query here is a `SELECT`. No mutation of any kind
 * is performed or exposed — no vacuum, no truncate, no kill, nothing. Each
 * section degrades independently and reports its own error, so the page can
 * show what is actually observable instead of a fabricated "healthy".
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { sql } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";

import { db } from "@/db/client";
import {
  chapter,
  committee,
  content,
  course,
  event,
  eventRegistration,
  forumPost,
  jobPosting,
  membershipTier,
  organization,
  session,
  user,
} from "@/db/schema";

/**
 * The core domain tables this status counts. Names are derived from the
 * Drizzle table objects at runtime (getTableConfig), never hand-typed, so
 * the counts cannot drift from the schema.
 */
const CORE_TABLES = [
  user,
  session,
  event,
  eventRegistration,
  content,
  forumPost,
  jobPosting,
  chapter,
  committee,
  course,
  membershipTier,
  organization,
] as const;

export interface CoreTableRowCount {
  table: string;
  rows: number;
}

export interface MigrationJournalState {
  /** Whether drizzle/meta/_journal.json could be read from this deployment. */
  readable: boolean;
  entryCount: number | null;
  latestTag: string | null;
}

export interface AppliedMigrationsState {
  /**
   * The `drizzle.__drizzle_migrations` bookkeeping table exists. It is absent when
   * the database was set up with a legacy `drizzle-kit push` workflow,
   * which applies schema without recording migrations.
   */
  bookkeepingTablePresent: boolean;
  count: number | null;
}

export interface MigrationState {
  journal: MigrationJournalState;
  applied: AppliedMigrationsState;
}

export interface DatabaseHealth {
  /** Whether the first query reached Postgres at all. */
  reachable: boolean;
  /** Connection/server error message when reachable is false. */
  error: string | null;
  /** `select version()` — the full Postgres version string. */
  serverVersion: string | null;
  /** `select current_database()`. */
  databaseName: string | null;
  /** Live `count(*)` per core table, in one round-trip. */
  tableCounts: CoreTableRowCount[] | null;
  migrations: MigrationState | null;
}

async function getServerFacts(): Promise<{
  reachable: boolean;
  error: string | null;
  serverVersion: string | null;
  databaseName: string | null;
}> {
  try {
    const rows = await db.execute(
      sql`select version() as server_version, current_database() as database_name`,
    );
    const row = rows[0] as { server_version?: string; database_name?: string } | undefined;
    return {
      reachable: true,
      error: null,
      serverVersion: row?.server_version ?? null,
      databaseName: row?.database_name ?? null,
    };
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : String(error),
      serverVersion: null,
      databaseName: null,
    };
  }
}

async function getCoreTableCounts(): Promise<CoreTableRowCount[] | null> {
  try {
    // One query, one subselect per table, aliases taken from the schema
    // objects: select (select count(*)::int from "users") as "users", …
    const columns = sql.join(
      CORE_TABLES.map((table) => {
        const { name } = getTableConfig(table);
        return sql`(select count(*)::int from ${table}) as ${sql.identifier(name)}`;
      }),
      sql`, `,
    );

    const rows = await db.execute(sql`select ${columns}`);
    const row = (rows[0] ?? {}) as Record<string, number | string | null>;

    return CORE_TABLES.map((table) => {
      const { name } = getTableConfig(table);
      return { table: name, rows: Number(row[name] ?? 0) };
    });
  } catch {
    return null;
  }
}

/**
 * The shipped-migration side of the ledger. The journal lives in the repo
 * (drizzle/meta/_journal.json); a production deployment that ships only the
 * built app may not carry it, in which case this says so instead of
 * guessing.
 */
async function readMigrationJournal(): Promise<MigrationJournalState> {
  try {
    const raw = await readFile(join(process.cwd(), "drizzle", "meta", "_journal.json"), "utf8");
    const parsed = JSON.parse(raw) as { entries?: { tag?: unknown }[] };
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    const last = entries[entries.length - 1];
    return {
      readable: true,
      entryCount: entries.length,
      latestTag: last && typeof last.tag === "string" ? last.tag : null,
    };
  } catch {
    return { readable: false, entryCount: null, latestTag: null };
  }
}

/**
 * The applied-migration side of the ledger, straight from Drizzle's
 * `drizzle.__drizzle_migrations` bookkeeping table (drizzle-kit keeps it in
 * its own `drizzle` schema). Absent when the database was created with a
 * legacy `drizzle-kit push` workflow, which keeps no ledger.
 */
async function readAppliedMigrations(): Promise<AppliedMigrationsState> {
  try {
    const rows = await db.execute(
      sql`select count(*)::int as applied from drizzle.__drizzle_migrations`,
    );
    const row = rows[0] as { applied?: number | string } | undefined;
    return { bookkeepingTablePresent: true, count: Number(row?.applied ?? 0) };
  } catch {
    return { bookkeepingTablePresent: false, count: null };
  }
}

export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const facts = await getServerFacts();

  if (!facts.reachable) {
    return { ...facts, tableCounts: null, migrations: null };
  }

  const [tableCounts, journal, applied] = await Promise.all([
    getCoreTableCounts(),
    readMigrationJournal(),
    readAppliedMigrations(),
  ]);

  return {
    ...facts,
    tableCounts,
    migrations: { journal, applied },
  };
}
