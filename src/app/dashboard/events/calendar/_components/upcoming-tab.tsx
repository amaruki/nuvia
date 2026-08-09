"use client";

/**
 * Upcoming events tab, fed by real events from the server page. Attendee
 * counts are the real registration totals from the event service.
 */

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";

import type { CalendarEventDto } from "./calendar-event-dto";
import { formatDate } from "@/lib/utils/date-utils";

interface UpcomingTabProps {
  events: CalendarEventDto[];
}

export function UpcomingTab({ events }: UpcomingTabProps) {
  const router = useRouter();

  return (
    <TabsContent value="upcoming" className="space-y-6 animate-in fade-in-50 duration-500">
      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-2">No Upcoming Events</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Upcoming events will appear here as soon as they are scheduled.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.slice(0, 9).map((event) => (
            <Card
              key={event.id}
              className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription>{formatDate(event.startDate, "MMM d, yyyy")}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {event.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(event.startDate, "h:mm a")}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {event.currentAttendees}
                      {event.maxAttendees !== undefined ? ` / ${event.maxAttendees}` : ""} attendees
                    </span>
                  </div>
                </div>
                <Button className="w-full" onClick={() => router.push(`/events/${event.id}`)}>
                  View Event
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </TabsContent>
  );
}
