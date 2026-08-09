/**
 * Public events page — Server Component (backlog B2, UI-24 items 1+2).
 *
 * Reads real event rows through the server-side read service: a server
 * component cannot hold the authenticated client session the EventList hook
 * would need, and this page is visible to anonymous visitors anyway. Only
 * published, public events are listed here; lifecycle states that still
 * accept an audience (registration open/closed, in progress) are included.
 *
 * Pagination and filters live in searchParams (see _lib/public-events-query):
 * a fixed page of PUBLIC_EVENTS_PAGE_SIZE events, real prev/next links, and
 * the shared EventFilter wired server-side — no silent cap at the old
 * limit:100 fetch.
 */

import Link from "next/link";
import { Calendar } from "lucide-react";

import { EventCard } from "@/components/events";
import { EventListLayout } from "@/components/events/event-list-layout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listEvents } from "@/lib/services/event-read.service";

import { EventsPagination } from "./_components/events-pagination";
import { PublicEventFilters } from "./_components/public-event-filters";
import { parsePublicEventsSearchParams, publicEventsHref } from "./_lib/public-events-query";

// Event rows change at runtime; never serve a build-time snapshot.
export const dynamic = "force-dynamic";

interface EventsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const rawParams = await searchParams;
  const normalized = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) normalized.append(key, entry);
    } else {
      normalized.set(key, value);
    }
  }

  const query = parsePublicEventsSearchParams(normalized);
  const { events, total, page, totalPages } = query.forceEmpty
    ? { events: [], total: 0, page: query.page, totalPages: 1 }
    : await listEvents(query.listParams);

  const hasActiveFilters = Object.keys(query.filter).length > 0;

  return (
    <EventListLayout
      title="Events"
      description="Discover and join events that match your interests"
      icon={<Calendar className="h-8 w-8 text-primary" />}
      showBackButton={false}
    >
      <PublicEventFilters filter={query.filter} />

      {events.length > 0 && (
        <p className="text-muted-foreground mb-4 text-sm" role="status">
          {total} {total === 1 ? "event" : "events"}
          {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
        </p>
      )}

      {events.length === 0 ? (
        total > 0 ? (
          <EmptyState
            title="No events on this page"
            description="This page is out of range — the results moved."
            icon={<Calendar className="h-12 w-12 text-muted-foreground/40" />}
            actions={
              <Button asChild variant="outline">
                <Link href={publicEventsHref(normalized, 1)}>Back to page 1</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No events found"
            description={
              hasActiveFilters
                ? "No events match your filters. Try adjusting or clearing them."
                : "There are no upcoming events at the moment. Check back later."
            }
            icon={<Calendar className="h-12 w-12 text-muted-foreground/40" />}
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <EventsPagination
          page={page}
          totalPages={totalPages}
          total={total}
          searchParams={normalized}
        />
      </div>
    </EventListLayout>
  );
}
