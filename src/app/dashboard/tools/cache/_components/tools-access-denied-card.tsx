import { ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Shown to any signed-in user who reaches the URL without the superadmin
 * role. Mirrors the access-denied pattern used elsewhere in the dashboard
 * (e.g. events/certificates), adapted for the superadmin-only tools
 * section.
 */
export function ToolsAccessDeniedCard() {
  return (
    <div className="space-y-6 p-6 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Cache</h1>
      </header>
      <Card>
        <EmptyState
          icon={<ShieldCheck className="size-8 text-muted-foreground" aria-hidden="true" />}
          title="Superadmin access required"
          description="Live cache status is restricted to the superadmin role. Your current role can't view this tool. Contact a superadmin if you believe this is a mistake."
        />
      </Card>
    </div>
  );
}
