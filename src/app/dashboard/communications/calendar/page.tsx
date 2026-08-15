import { CalendarDays } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";

/**
 * Nav lists this surface (src/lib/navigation-data/communications.ts), but no
 * external calendar integration exists in the codebase. The page says so and
 * points to the working event listing instead of inventing one.
 */
export default function CommunicationsCalendar() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar Integration"
        description="Sync organization events with external calendars."
      />
      <Card>
        <EmptyState
          icon={<CalendarDays className="size-8 text-muted-foreground" aria-hidden="true" />}
          title="No calendar integration yet"
          description="This module is not built: there is no calendar feed, export, or provider in the codebase. Scheduled events live under Event Management in the Events section today."
        />
      </Card>
    </div>
  );
}
