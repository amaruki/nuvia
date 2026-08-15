/**
 * Tools / Cache (UI-23/D3). Superadmin-only, read-only operational status.
 *
 * Everything on this page comes from a live probe (one Redis PING) plus
 * configuration facts from src/lib/session-cache and src/lib/env. There is
 * no flush button on purpose: this repository has no global cache-flush
 * function — the only FLUSHDB lives in the a11y test harness, where it
 * clears a dedicated test Redis, not application state. The page says so
 * instead of offering a fake action.
 */

import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { isRoleAllowedForPath } from "@/lib/dashboard-access";
import { getCurrentUser } from "@/lib/rbac";
import { getCacheSystemStatus } from "@/lib/services/system-cache.service";
import { CacheStatusPanel } from "./_components/cache-status-panel";
import { DemoSandboxNotice } from "./_components/demo-sandbox-notice";
import { ToolsAccessDeniedCard } from "./_components/tools-access-denied-card";

// The status below is probed at request time; never serve a stale snapshot.
export const dynamic = "force-dynamic";

const PATH = "/dashboard/tools/cache";

export default async function ToolsCachePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  // UI-39 mechanism: the nav-data roles gate (enforced by the proxy too).
  if (!isRoleAllowedForPath(PATH, user.role)) {
    return <ToolsAccessDeniedCard />;
  }

  // Superadmin-only: navigation lists admin + superadmin for the tools
  // section, but live cache status is restricted to the superadmin role.
  if (user.role !== "superadmin") {
    return <ToolsAccessDeniedCard />;
  }

  const status = await getCacheSystemStatus();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cache"
        description="Live status of the session cache and its Redis backend. Values are probed when this page loads — nothing here is stored or invented."
      />

      <div>
        <Badge variant="outline">Read-only</Badge>
      </div>

      <DemoSandboxNotice />
      <CacheStatusPanel status={status} />
    </div>
  );
}
