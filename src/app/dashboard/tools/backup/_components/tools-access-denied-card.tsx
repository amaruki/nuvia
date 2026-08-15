import { ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";

/**
 * Shown to any signed-in user who reaches the URL without the superadmin
 * role. Mirrors the access-denied pattern used elsewhere in the dashboard
 * (e.g. events/certificates), adapted for the superadmin-only tools
 * section.
 */
export function ToolsAccessDeniedCard() {
  return (
    <div className="space-y-6">
      <PageHeader title="Backup" />
      <Card>
        <EmptyState
          icon={<ShieldCheck className="size-8 text-muted-foreground" aria-hidden="true" />}
          title="Superadmin access required"
          description="Backup status is restricted to the superadmin role. Your current role can't view this tool. Contact a superadmin if you believe this is a mistake."
        />
      </Card>
    </div>
  );
}
