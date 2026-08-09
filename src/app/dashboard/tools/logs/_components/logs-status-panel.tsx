import { FileText, ScrollText, Settings2, Terminal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LogsSystemStatus } from "@/lib/services/system-logs.service";

/**
 * Renders the status produced by getLogsSystemStatus(). Pure presentation.
 * The honest headline: logs go to stdout and nowhere else, so there is no
 * log history to browse — the panel says exactly that and points at the run
 * commands whose stdout carries the logs.
 */
export function LogsStatusPanel({ status }: { status: LogsSystemStatus }) {
  const { auditTrail } = status;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
            Where logs go
          </CardTitle>
          <CardDescription>
            The whole application uses one structured logger — {status.loggerModule} (ADR-0004).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Sink</span>
            <Badge variant="secondary">
              {status.sink} / stderr — {status.lineFormat}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            There is no file sink and no log transport in this codebase, so no log history is
            persisted anywhere this page could browse. What you see here is the complete truth about
            application logging — the storage is your platform&apos;s log collector, fed by the
            process&apos;s stdout.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="size-4 text-muted-foreground" aria-hidden="true" />
            Logger configuration
          </CardTitle>
          <CardDescription>From src/lib/env.ts at request time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">LOGGING_LEVEL (minimum emitted)</span>
            <span className="font-mono text-xs">{status.configuredLevel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">LOGGING_REQUESTS</span>
            <span className="font-mono text-xs">
              {status.requestLoggingEnabled ? "true" : "false"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">LOGGING_ERRORS</span>
            <span className="font-mono text-xs">
              {status.errorLoggingEnabled ? "true" : "false"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Terminal className="size-4 text-muted-foreground" aria-hidden="true" />
            To read the logs
          </CardTitle>
          <CardDescription>
            Run the app and watch its stdout — that is the only log store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {status.runCommands.map((entry) => (
            <div key={entry.label} className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{entry.label}</span>
              <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                {entry.command}
              </code>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="size-4 text-muted-foreground" aria-hidden="true" />
            Persisted audit trail
          </CardTitle>
          <CardDescription>
            The auth layer writes audit events to the auth_logs table — the only log-like data this
            application persists. It is written by the auth layer, not by the logger.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {auditTrail.error ? (
            <p className="text-muted-foreground">
              Audit count unavailable on this request — the database reported: {auditTrail.error}
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Events in auth_logs</span>
                <span className="tabular-nums">{auditTrail.rowCount}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Newest event</span>
                <span className="font-mono text-xs">{auditTrail.lastEventAt ?? "none yet"}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
