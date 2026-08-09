/**
 * Read-only backup status for the tools/backup page (UI-23/D3).
 *
 * Recon facts, checked before writing this file:
 * - No backup, snapshot, or restore automation exists in this repository.
 *   scripts/ holds only seed/reset/a11y/integration runners (the live
 *   listing is read below, so the page shows what actually exists).
 * - `pg_dump`, `pg_restore`, and third-party backup tooling appear nowhere
 *   in the codebase or the docs.
 * - compose.yml runs postgres:16 with a tmpfs volume — local development
 *   data is ephemeral by design.
 *
 * So the page's honest answer is: backups are operator-managed. This
 * service gathers the real facts an operator needs, including an example
 * command derived from compose.yml's actual values — clearly labeled as an
 * example, NOT a configured feature. There is no "backup now" action
 * anywhere in this surface.
 */

import { readdir } from "node:fs/promises";
import { join } from "node:path";

/** Postgres facts copied from compose.yml (the dev stack's source of truth). */
export const COMPOSE_POSTGRES = {
  image: "postgres:16",
  service: "postgres",
  database: "nuvia",
  user: "nuvia",
  hostPort: "127.0.0.1:15433",
  volume: "tmpfs (data does not survive a container restart)",
} as const;

export interface BackupSystemStatus {
  /**
   * Literal false: no backup system is configured in this codebase. This is
   * a fact about the repository, not a probe — when a real backup system
   * lands, it should replace this service rather than flip this flag.
   */
  configured: false;
  /** What was checked, stated plainly. */
  findings: string[];
  /** Live listing of scripts/ — the automation that actually exists. */
  repoScripts: string[];
  postgres: typeof COMPOSE_POSTGRES;
  /**
   * Examples only, derived from compose.yml values. Not configured, not
   * scheduled, not tested by this repo — an operator's starting point.
   */
  exampleCommands: { label: string; command: string }[];
  /** Documentation that bears on backup/restore decisions. */
  relatedDocs: { path: string; note: string }[];
}

export async function getBackupSystemStatus(): Promise<BackupSystemStatus> {
  let repoScripts: string[] = [];
  try {
    repoScripts = (await readdir(join(process.cwd(), "scripts"))).sort();
  } catch {
    // A deployment that ships only the built app may omit scripts/; the
    // findings below still stand.
  }

  return {
    configured: false,
    findings: [
      "No backup automation exists in this repository — no script runs pg_dump or pg_restore, nothing schedules snapshots, and the scripts/ listing below is complete.",
      "compose.yml runs postgres:16 on a tmpfs volume, so local development data is ephemeral by design.",
      "Backups are therefore operator-managed: this page reports status only and offers no backup action.",
    ],
    repoScripts,
    postgres: COMPOSE_POSTGRES,
    exampleCommands: [
      {
        label:
          "Dump the compose dev database (example — adapt credentials and host for real deployments)",
        command: "docker compose exec postgres pg_dump -U nuvia nuvia > nuvia-backup.sql",
      },
      {
        label: "Restore that dump into a fresh database (example)",
        command: "docker compose exec -T postgres psql -U nuvia nuvia < nuvia-backup.sql",
      },
    ],
    relatedDocs: [
      {
        path: "docs/DEPLOYMENT_PLAN.md",
        note: "Runtime facts for the database and Redis this backup would cover.",
      },
      {
        path: "docs/release.md",
        note: "Migration compatibility (expand/contract) and rollback — restoring across an already-run migration is the hard case.",
      },
    ],
  };
}
