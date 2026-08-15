#!/bin/sh
# PostgreSQL backup for Nuvia deployments — docs/DEPLOYMENT_PLAN.md.
#
# Dumps the application database with pg_dump (custom format: compressed,
# selective-restore capable), timestamps the file, and prunes backups
# older than BACKUP_RETENTION_DAYS. Designed for cron:
#
#   0 3 * * * /opt/nuvia/scripts/backup.sh >> /var/log/nuvia-backup.log 2>&1
#
# Requirements:
#   - pg_dump on PATH (PostgreSQL 16 client)
#   - DATABASE_URL exported (the app's connection string)
#   - BACKUP_DIR writable (default: /var/backups/nuvia)
#
# Exit codes: 0 on success, 1 on any failure — so cron's MAILTO (or your
# monitoring) actually sees a failed backup. A silent backup failure is
# worse than no backup: it is a backup you believe in.
set -eu

DATABASE_URL="${DATABASE_URL:?DATABASE_URL must be set}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/nuvia}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="$BACKUP_DIR/nuvia-$TIMESTAMP.dump"

mkdir -p "$BACKUP_DIR"

# --format=custom: compressed, restorable via pg_restore --clean.
# --no-owner: restores cleanly into a differently-named role.
pg_dump --format=custom --no-owner --file="$BACKUP_FILE" "$DATABASE_URL"

# Verify the dump is readable before declaring success: a zero-byte or
# truncated dump must fail the run, not wait for the restore emergency.
pg_restore --list "$BACKUP_FILE" > /dev/null

SIZE="$(du -h "$BACKUP_FILE" | cut -f1)"
echo "$TIMESTAMP backup ok: $BACKUP_FILE ($SIZE)"

# Prune old backups (keep anything newer than the retention window).
find "$BACKUP_DIR" -name 'nuvia-*.dump' -mtime +"$RETENTION_DAYS" -delete
