"use client";

/**
 * Client shell for the events calendar. Owns tab state (formerly
 * use-events-calendar) and distributes the real event DTOs fetched by the
 * server page to the individual tabs. Event creation lives at
 * /dashboard/events/create (linked from CalendarHeaderControls).
 */

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useHeader } from "@/contexts/dashboard-context";

import type { CalendarEventDto } from "./calendar-event-dto";
import { CalendarHeaderControls } from "./calendar-header-controls";
import type { TabId } from "./calendar-tabs";
import { CalendarView } from "./calendar-view";
import { ListViewTab } from "./list-view-tab";
import { PastEventsTab } from "./past-events-tab";
import { UpcomingTab } from "./upcoming-tab";

interface CalendarShellProps {
  upcomingEvents: CalendarEventDto[];
  pastEvents: CalendarEventDto[];
}

export function CalendarShell({ upcomingEvents, pastEvents }: CalendarShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>("calendar");
  const { setHeader, clearHeader } = useHeader();

  useEffect(() => {
    setHeader({
      title: "Events Calendar",
      description: "Manage and monitor community events and activities",
    });
    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  // The calendar and list views show every event the page fetched.
  const allEvents = useMemo(
    () => [...upcomingEvents, ...pastEvents].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [upcomingEvents, pastEvents],
  );

  return (
    <div className="flex flex-col space-y-6 p-6 max-w-[1600px] mx-auto ">
      <div>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabId)}
          className="space-y-6"
        >
          <CalendarHeaderControls />

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6 animate-in fade-in-50 duration-500">
            <CalendarView events={allEvents} />
          </TabsContent>

          {/* List View Tab */}
          <ListViewTab events={allEvents} />

          {/* Upcoming Events Tab */}
          <UpcomingTab events={upcomingEvents} />

          {/* Past Events Tab */}
          <PastEventsTab events={pastEvents} />
        </Tabs>
      </div>
    </div>
  );
}
