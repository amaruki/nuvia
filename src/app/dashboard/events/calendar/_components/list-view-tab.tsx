"use client";

/**
 * List view tab, fed by real events from the server page (no sample data).
 */

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Clock, List, MapPin } from "lucide-react";

import type { CalendarEventDto } from "./calendar-event-dto";
import { formatDate } from "@/lib/utils/date-utils";

interface ListViewTabProps {
  events: CalendarEventDto[];
}

export function ListViewTab({ events }: ListViewTabProps) {
  const router = useRouter();

  return (
    <TabsContent value="list" className="space-y-6 animate-in fade-in-50 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            All Events
          </CardTitle>
          <CardDescription>Comprehensive list of all community events</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12 bg-muted/10 rounded-lg border border-dashed">
              <List className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No Events</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Events will appear here as soon as they are created.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const start = new Date(event.startDate);
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px] p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <div className="text-xs text-muted-foreground uppercase font-semibold">
                          {formatDate(start, "MMM d, yyyy").split(" ")[0]}
                        </div>
                        <div className="text-2xl font-bold text-primary">{start.getDate()}</div>
                      </div>
                      <div>
                        <h5 className="font-semibold text-lg">{event.title}</h5>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(start, "h:mm a")}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
