import { Newspaper } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";

/**
 * Nav lists this surface (src/lib/navigation-data/communications.ts), but the
 * schema has no newsletter entities — nothing to list or send. The page says
 * so instead of rendering a fabricated inbox.
 */
export default function CommunicationsNewsletters() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletters"
        description="Email newsletters for members and subscribers."
      />
      <Card>
        <EmptyState
          icon={<Newspaper className="size-8 text-muted-foreground" aria-hidden="true" />}
          title="No newsletter system yet"
          description="This module is not built: the database has no newsletter tables, so there is nothing to compose, schedule, or send here. Announcements in the Content section is the working broadcast surface today."
        />
      </Card>
    </div>
  );
}
