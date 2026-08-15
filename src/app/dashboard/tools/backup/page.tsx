/**
 * Tools / Backup (UI-23/D3). Superadmin-only, honest operator-managed
 * status.
 *
 * Verified by reading the repository first: there is no backup system here.
 * No backup script, no pg_dump automation, no scheduled snapshot — scripts/
 * holds only seed/reset/a11y/integration runners. So this page refuses to
 * offer a "backup now" button and instead reports the truth: backups are
 * operator-managed. It shows the automation that actually exists (live
 * listing of scripts/), the compose.yml Postgres facts, a clearly-labeled
 * example command derived from them, and the docs that matter for restore.
 */

import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { isRoleAllowedForPath } from "@/lib/dashboard-access";
import { getCurrentUser } from "@/lib/rbac";
import { getBackupSystemStatus } from "@/lib/services/system-backup.service";
import { BackupStatusPanel } from "./_components/backup-status-panel";
import { DemoSandboxNotice } from "./_components/demo-sandbox-notice";
import { ToolsAccessDeniedCard } from "./_components/tools-access-denied-card";

// The scripts/ listing is read at request time; never serve a stale snapshot.
export const dynamic = "force-dynamic";

const PATH = "/dashboard/tools/backup";

export default async function ToolsBackupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  // UI-39 mechanism: the nav-data roles gate (enforced by the proxy too).
  if (!isRoleAllowedForPath(PATH, user.role)) {
    return <ToolsAccessDeniedCard />;
  }

  // Superadmin-only: navigation lists admin + superadmin for the tools
  // section, but backup status is restricted to the superadmin role.
  if (user.role !== "superadmin") {
    return <ToolsAccessDeniedCard />;
  }

  const status = await getBackupSystemStatus();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Backup</h1>
          <Badge variant="outline">Operator-managed</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Backups in this codebase are operator-managed — there is no backup system to show a status
          for. Below is what actually exists.
        </p>
      </header>

      <DemoSandboxNotice />
      <BackupStatusPanel status={status} />
    </div>
  );
}
