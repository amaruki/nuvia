"use client";

/**
 * Card listing the next few upcoming events with Today/Tomorrow badges.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import type { Event } from "@/types/event";
import { formatDate, formatTime, isEventToday, isEventTomorrow } from "./date-utils";

interface UpcomingEventsCardProps {
  events: Event[];
}

export function UpcomingEventsCard({ events }: UpcomingEventsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Upcoming Events</span>
          <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/events")}>
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-foreground/50">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-foreground/40" />
            <p>No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="flex items-start p-3 border rounded-lg hover:bg-background transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-foreground/90">{event.title}</h3>
                  <div className="flex items-center text-sm text-foreground/50 mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-foreground/50 mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatTime(event.startDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-foreground/50 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>
                <div className="ml-2">
                  {isEventToday(event.startDate) && (
                    <Badge className="bg-info/20 text-info">Today</Badge>
                  )}
                  {isEventTomorrow(event.startDate) && (
                    <Badge className="bg-accent text-accent-foreground">Tomorrow</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
