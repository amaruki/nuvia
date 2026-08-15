import { BookOpen, Database, FolderOpen, Terminal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BackupSystemStatus } from "@/lib/services/system-backup.service";

/**
 * Renders the status produced by getBackupSystemStatus(). Pure presentation.
 * The headline is honest by construction: `configured` is the literal false
 * from the service, so this panel can never claim a backup system exists.
 */
export function BackupStatusPanel({ status }: { status: BackupSystemStatus }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span>Backup status</span>
            <Badge variant="warning">Not configured</Badge>
          </CardTitle>
          <CardDescription>What was actually checked, stated plainly.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {status.findings.map((finding) => (
              <li key={finding}>{finding}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderOpen className="size-4 text-muted-foreground" aria-hidden="true" />
            Automation that exists
          </CardTitle>
          <CardDescription>
            Live listing of scripts/ at request time — the complete set of operational scripts in
            this repository. None of them takes a backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          {status.repoScripts.length > 0 ? (
            <ul className="space-y-1 font-mono text-xs">
              {status.repoScripts.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">scripts/ is not readable from this deployment.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4 text-muted-foreground" aria-hidden="true" />
            What a backup would cover
          </CardTitle>
          <CardDescription>Postgres facts from compose.yml (the dev stack).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Image</span>
            <span className="font-mono text-xs">{status.postgres.image}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Database / user</span>
            <span className="font-mono text-xs">
              {status.postgres.database} / {status.postgres.user}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Host port</span>
            <span className="font-mono text-xs">{status.postgres.hostPort}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Volume</span>
            <span className="text-right text-xs">{status.postgres.volume}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Terminal className="size-4 text-muted-foreground" aria-hidden="true" />
            Example commands
          </CardTitle>
          <CardDescription>
            Examples only, derived from the compose.yml values above. They are not configured, not
            scheduled, and not tested by this repository — a starting point for the operator who
            owns backups in production.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {status.exampleCommands.map((entry) => (
            <div key={entry.label} className="space-y-1">
              <p className="text-muted-foreground">{entry.label}</p>
              <pre
                tabIndex={0}
                role="region"
                aria-label={`${entry.label} command`}
                className="overflow-x-auto rounded bg-muted p-3 font-mono text-xs focus-visible:outline-2 focus-visible:outline-ring"
              >
                {entry.command}
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-muted-foreground" aria-hidden="true" />
            Related documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {status.relatedDocs.map((doc) => (
              <li key={doc.path}>
                <code className="font-mono text-xs">{doc.path}</code>
                <span className="text-muted-foreground"> — {doc.note}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
