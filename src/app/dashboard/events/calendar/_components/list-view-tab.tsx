"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Clock, List, MapPin } from "lucide-react";

import { sampleEvents } from "./calendar-data";

export function ListViewTab() {
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
          <div className="space-y-3">
            {sampleEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px] p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">
                      {event.date.toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </div>
                    <div className="text-2xl font-bold text-primary">{event.date.getDate()}</div>
                  </div>
                  <div>
                    <h5 className="font-semibold text-lg">{event.title}</h5>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
