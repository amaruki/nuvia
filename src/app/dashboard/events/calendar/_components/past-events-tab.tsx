"use client";

/**
 * Past events tab, fed by real events from the server page (no sample data).
 */

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Clock, MapPin } from "lucide-react";

import type { CalendarEventDto } from "./calendar-event-dto";
import { formatDate } from "@/lib/utils/date-utils";

interface PastEventsTabProps {
  events: CalendarEventDto[];
}

export function PastEventsTab({ events }: PastEventsTabProps) {
  const router = useRouter();

  return (
    <TabsContent value="past" className="space-y-6 animate-in fade-in-50 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Event History
          </CardTitle>
          <CardDescription>Archive of previously held community events</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-16 bg-muted/10 rounded-lg border border-dashed">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No Past Events</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Past events will appear here once they&apos;ve occurred. Check back later for event
                archives.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => router.push(`/events/${event.id}`)}
                  className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors text-left"
                >
                  <div>
                    <h5 className="font-semibold">{event.title}</h5>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{formatDate(event.startDate, "MMM d, yyyy")}</span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {event.currentAttendees} attendees
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
