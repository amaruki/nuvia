"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Clock, MapPin, Users } from "lucide-react";

import { sampleEvents } from "./calendar-data";

export function UpcomingTab() {
  return (
    <TabsContent value="upcoming" className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sampleEvents.slice(0, 3).map((event, i) => (
          <Card
            key={event.id}
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription>
                    {event.date.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {i + 1}d
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{20 + i * 10} attendees</span>
                </div>
              </div>
              <Button className="w-full">Register Now</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </TabsContent>
  );
}
