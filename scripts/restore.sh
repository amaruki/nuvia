#!/bin/sh
# Restore a Nuvia PostgreSQL backup — the companion of scripts/backup.sh.
#
# Usage:
#   DATABASE_URL=... scripts/restore.sh /var/backups/nuvia-<timestamp>.dump
#
# This script DROPS AND RECREATES the public schema of whatever database
# DATABASE_URL points at. It is the restore drill from
# docs/DEPLOYMENT_PLAN.md: run it against a scratch database regularly to
# prove backups are actually restorable. Never point it at a database you
# have not decided to overwrite.
#
# Restore with the app DOWN (or scaled to zero): an application writing
# during a restore corrupts the very thing you are trying to recover.
set -eu

DATABASE_URL="${DATABASE_URL:?DATABASE_URL must be set}"
BACKUP_FILE="${1:?usage: restore.sh <path-to-dump>}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "error: backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

# Fail fast on a corrupt/truncated dump before touching the database.
pg_restore --list "$BACKUP_FILE" > /dev/null

echo "Restoring $BACKUP_FILE into $DATABASE_URL — this WIPES the database."
printf 'Type YES to continue: '
read -r CONFIRM
if [ "$CONFIRM" != "YES" ]; then
  echo "aborted"
  exit 1
fi

# Drop and recreate public (same shape as scripts/db-reset.ts), then
# restore. --clean would only remove objects present in the dump, so the
# schema drop is the reliable reset.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
drop schema if exists drizzle cascade;
drop schema public cascade;
create schema public;
grant all on schema public to public;
SQL

pg_restore --format=custom --no-owner --exit-on-error "$BACKUP_FILE" -d "$DATABASE_URL"

echo "restore complete — run 'bun run scripts/db-migrate.ts' if any migrations"
echo "landed after the backup was taken, then smoke-test before reopening."
