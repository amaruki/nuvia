"use client";

/**
 * Card listing events the current user organizes, with status badge and
 * a manage action per event.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import type { Event } from "@/types/event";
import { formatDate } from "./date-utils";

interface MyEventsCardProps {
  events: Event[];
}

export function MyEventsCard({ events }: MyEventsCardProps) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Events I'm Organizing</span>
          <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/events")}>
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.slice(0, 3).map((event) => (
            <div key={event.id} className="border rounded-lg overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-primary to-chart-4 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-primary-foreground/30" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                  <h3 className="text-white font-medium truncate">{event.title}</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center text-sm text-foreground/50 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatDate(event.startDate)}</span>
                </div>
                <div className="flex items-center text-sm text-foreground/50 mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="truncate">{event.location}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge
                    className={
                      event.status === "published"
                        ? "bg-chart-2/20 text-success"
                        : event.status === "draft"
                          ? "bg-warning/20 text-warning"
                          : event.status === "cancelled"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-info/20 text-info"
                    }
                  >
                    {event.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = `/events/${event.id}`)}
                  >
                    Manage
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
