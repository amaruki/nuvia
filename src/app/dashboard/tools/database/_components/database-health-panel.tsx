import { AlertTriangle, BookOpen, Database, TableProperties } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DatabaseHealth } from "@/lib/services/system-database.service";

/**
 * Renders the health produced by getDatabaseHealth(). Pure presentation —
 * every degraded state (unreachable server, unreadable journal, missing
 * bookkeeping table) is labeled with its real cause instead of being hidden
 * behind a green dot.
 */
export function DatabaseHealthPanel({ health }: { health: DatabaseHealth }) {
  if (!health.reachable) {
    return (
      <Alert variant="destructive">
        <AlertTriangle aria-hidden="true" />
        <AlertTitle>Database unreachable</AlertTitle>
        <AlertDescription>
          No query reached Postgres on this request. The server reported: {health.error}
        </AlertDescription>
      </Alert>
    );
  }

  const { migrations } = health;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4 text-muted-foreground" aria-hidden="true" />
            Connection
          </CardTitle>
          <CardDescription>
            Result of <code className="font-mono text-xs">select version()</code> and{" "}
            <code className="font-mono text-xs">current_database()</code> on this request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Reachable</span>
            <Badge variant="success">Yes</Badge>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Database</span>
            <p className="font-mono text-xs">{health.databaseName ?? "unknown"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground">Server version</span>
            <p className="font-mono text-xs">{health.serverVersion ?? "unknown"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TableProperties className="size-4 text-muted-foreground" aria-hidden="true" />
            Core table row counts
          </CardTitle>
          <CardDescription>
            Live <code className="font-mono text-xs">count(*)</code> per core table, table names
            taken from the Drizzle schema.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          {health.tableCounts ? (
            <ul className="divide-y text-sm">
              {health.tableCounts.map((entry) => (
                <li key={entry.table} className="flex items-center justify-between py-1.5">
                  <span className="font-mono text-xs">{entry.table}</span>
                  <span className="tabular-nums">{entry.rows}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              Row counts unavailable on this request — the count query failed even though the
              connection probe succeeded.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-muted-foreground" aria-hidden="true" />
            Migration state
          </CardTitle>
          <CardDescription>
            Both sides of the ledger: the journal shipped in drizzle/meta/_journal.json and the
            applied entries Drizzle records in __drizzle_migrations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {migrations?.journal.readable ? (
            <p>
              Shipped journal: <strong>{migrations.journal.entryCount}</strong>{" "}
              {migrations.journal.entryCount === 1 ? "entry" : "entries"}
              {migrations.journal.latestTag ? (
                <>
                  , latest <code className="font-mono text-xs">{migrations.journal.latestTag}</code>
                </>
              ) : null}
              .
            </p>
          ) : (
            <p className="text-muted-foreground">
              Shipped journal: drizzle/meta/_journal.json is not readable from this deployment
              (expected when only the built app is shipped). Run{" "}
              <code className="font-mono text-xs">bun run db:migrate</code> from the repository to
              apply migrations.
            </p>
          )}

          {migrations?.applied.bookkeepingTablePresent ? (
            <p>
              Applied migrations: <strong>{migrations.applied.count}</strong> recorded in{" "}
              <code className="font-mono text-xs">drizzle.__drizzle_migrations</code>.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Applied migrations: no{" "}
              <code className="font-mono text-xs">drizzle.__drizzle_migrations</code> bookkeeping
              table. That is expected when the database was created with a legacy{" "}
              <code className="font-mono text-xs">drizzle-kit push</code> workflow, which applies
              schema without a ledger — it does not by itself mean the schema is wrong.
            </p>
          )}
        </CardContent>
      </Card>

      <Alert className="md:col-span-2">
        <AlertDescription>
          Read-only by design: this page runs SELECT queries only and exposes no destructive control
          — no vacuum, truncate, kill, or drop — in any mode.
        </AlertDescription>
      </Alert>
    </div>
  );
}
