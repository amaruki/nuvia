/**
 * Public events page — Server Component (backlog B2).
 *
 * Reads real event rows through the server-side read service: a server
 * component cannot hold the authenticated client session the EventList hook
 * would need, and this page is visible to anonymous visitors anyway. Only
 * published, public events are listed here; lifecycle states that still
 * accept an audience (registration open/closed, in progress) are included.
 */

import { Calendar } from "lucide-react";
import { EventCard } from "@/components/events";
import { EventListLayout } from "@/components/events/event-list-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { listEvents } from "@/lib/services/event-read.service";

// Event rows change at runtime; never serve a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const { events } = await listEvents({
    visibility: ["PUBLIC"],
    status: ["PUBLISHED", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "IN_PROGRESS"],
    sortBy: "startTime",
    sortOrder: "asc",
    limit: 100,
  });

  return (
    <EventListLayout
      title="Events"
      description="Discover and join events that match your interests"
      icon={<Calendar className="h-8 w-8 text-primary" />}
      showBackButton={false}
    >
      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="There are no upcoming events at the moment. Check back later."
          icon={
            <Calendar
              className="h-12 w-12"
              style={{ color: "var(--muted-foreground)", opacity: "0.4" }}
            />
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </EventListLayout>
  );
}
