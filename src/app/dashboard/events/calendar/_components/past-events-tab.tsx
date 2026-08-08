"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Clock } from "lucide-react";

export function PastEventsTab() {
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
          <div className="text-center py-16 bg-muted/10 rounded-lg border border-dashed">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-2">No Past Events</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Past events will appear here once they've occurred. Check back later for event
              archives.
            </p>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
