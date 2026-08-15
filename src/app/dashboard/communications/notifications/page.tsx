import { Bell } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";

/**
 * Nav lists this surface (src/lib/navigation-data/communications.ts), but the
 * schema has no notification tables — nothing to deliver or configure. The
 * page reports that honestly.
 */
export default function CommunicationsNotifications() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification System"
        description="Delivery channels and member notification preferences."
      />
      <Card>
        <EmptyState
          icon={<Bell className="size-8 text-muted-foreground" aria-hidden="true" />}
          title="No notification system yet"
          description="This module is not built: the database stores no notifications, channels, or delivery logs, so there is nothing to configure or inspect here. Email remains the only outbound channel, managed under Email settings."
        />
      </Card>
    </div>
  );
}
