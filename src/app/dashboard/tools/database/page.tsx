/**
 * Tools / Database (UI-23/D3). Superadmin-only, read-only health.
 *
 * Everything here is a SELECT: the Postgres version string, per-core-table
 * row counts, and the migration ledger on both sides (shipped journal vs
 * applied bookkeeping). There are deliberately no destructive controls on
 * this page — no vacuum, no truncate, no kill, no drop — and the page says
 * so.
 */

import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { isRoleAllowedForPath } from "@/lib/dashboard-access";
import { getCurrentUser } from "@/lib/rbac";
import { getDatabaseHealth } from "@/lib/services/system-database.service";
import { DatabaseHealthPanel } from "./_components/database-health-panel";
import { DemoSandboxNotice } from "./_components/demo-sandbox-notice";
import { ToolsAccessDeniedCard } from "./_components/tools-access-denied-card";

// Health is measured at request time; never serve a stale snapshot.
export const dynamic = "force-dynamic";

const PATH = "/dashboard/tools/database";

export default async function ToolsDatabasePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  // UI-39 mechanism: the nav-data roles gate (enforced by the proxy too).
  if (!isRoleAllowedForPath(PATH, user.role)) {
    return <ToolsAccessDeniedCard />;
  }

  // Superadmin-only: navigation lists admin + superadmin for the tools
  // section, but database health is restricted to the superadmin role.
  if (user.role !== "superadmin") {
    return <ToolsAccessDeniedCard />;
  }

  const health = await getDatabaseHealth();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Database</h1>
          <Badge variant="outline">Read-only</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Live health of the Postgres database: server version, core-table row counts, and migration
          state. Every query on this page is a SELECT.
        </p>
      </header>

      <DemoSandboxNotice />
      <DatabaseHealthPanel health={health} />
    </div>
  );
}
