"use client";

import * as React from "react";
import { WidgetContainer } from "../../ui/widget-container";
import { EventCard } from "@/components/events";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { Event, EventStatus } from "@/types/event";
import { getEvents } from "@/lib/services/event";

interface EnhancedUpcomingEventsWidgetProps {
  limit?: number;
  onViewAllEvents?: () => void;
  onViewEvent?: (eventId: string) => void;
  onRegister?: (eventId: string) => void;
  className?: string;
}

export function EnhancedUpcomingEventsWidget({
  limit = 3,
  onViewAllEvents,
  onViewEvent,
  onRegister,
  className = "",
}: EnhancedUpcomingEventsWidgetProps) {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setIsLoading(true);

        // Fetch upcoming events
        const response = await getEvents(
          {
            status: [EventStatus.PUBLISHED],
            startDate: new Date(),
          },
          1,
          limit,
        );

        setEvents(response.events);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch events");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, [limit]);

  const handleViewAllEvents = () => {
    if (onViewAllEvents) {
      onViewAllEvents();
    } else {
      window.location.href = "/events";
    }
  };

  const handleViewEvent = (eventId: string) => {
    if (onViewEvent) {
      onViewEvent(eventId);
    } else {
      window.location.href = `/events/${eventId}`;
    }
  };

  const handleRegister = (eventId: string) => {
    if (onRegister) {
      onRegister(eventId);
    } else {
      window.location.href = `/events/${eventId}/register`;
    }
  };

  return (
    <WidgetContainer
      type="upcoming-events"
      title="Upcoming Events"
      description="Discover and join events that match your interests"
      size="large"
      className={className}
    >
      <div className="space-y-4">
        {/* Header with action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-foreground/50" />
            <span className="text-sm font-medium text-foreground/70">
              {events.length} upcoming events
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleViewAllEvents} className="text-xs">
            View all
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {/* Events list */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div
                className="animate-spin rounded-full h-8 w-8 border-2 border-muted-foreground"
                style={{ borderTopColor: "var(--primary)" }}
              ></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>Failed to load events</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-foreground/50">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-foreground/40" />
              <p>No upcoming events</p>
              <p className="text-sm mt-2">Check back later for new events.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg overflow-hidden">
                  <EventCard
                    event={event}
                    showRegistrationStatus={true}
                    onRegister={handleRegister}
                    onViewDetails={handleViewEvent}
                    className="border-0 shadow-none"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with create button */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => (window.location.href = "/events/create")}
          >
            Create New Event
          </Button>
        </div>
      </div>
    </WidgetContainer>
  );
}
