/**
 * Tools / Logs (UI-23/D3). Superadmin-only, honest log-system status.
 *
 * The truth this page reports (verified by reading the code first): the
 * application has exactly one logger — src/lib/logger.ts (ADR-0004) — and it
 * writes JSON lines to stdout/stderr. There is no file sink, no transport,
 * and therefore no stored log history to browse. So instead of a fake log
 * viewer, the page states exactly that, points operators at the run command
 * whose stdout carries the logs, and shows the one log-like thing that IS
 * persisted: the auth audit trail (auth_logs).
 */

import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { isRoleAllowedForPath } from "@/lib/dashboard-access";
import { getCurrentUser } from "@/lib/rbac";
import { getLogsSystemStatus } from "@/lib/services/system-logs.service";
import { DemoSandboxNotice } from "./_components/demo-sandbox-notice";
import { LogsStatusPanel } from "./_components/logs-status-panel";
import { ToolsAccessDeniedCard } from "./_components/tools-access-denied-card";

// The audit-trail count is read at request time; never serve a stale snapshot.
export const dynamic = "force-dynamic";

const PATH = "/dashboard/tools/logs";

export default async function ToolsLogsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  // UI-39 mechanism: the nav-data roles gate (enforced by the proxy too).
  if (!isRoleAllowedForPath(PATH, user.role)) {
    return <ToolsAccessDeniedCard />;
  }

  // Superadmin-only: navigation lists admin + superadmin for the tools
  // section, but log-system status is restricted to the superadmin role.
  if (user.role !== "superadmin") {
    return <ToolsAccessDeniedCard />;
  }

  const status = await getLogsSystemStatus();

  return (
    <div className="space-y-6 p-6 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
          <Badge variant="outline">Read-only</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Where this application&apos;s logs actually go, and the one persisted audit trail.
        </p>
      </header>

      <DemoSandboxNotice />
      <LogsStatusPanel status={status} />
    </div>
  );
}
