"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";

import { CalendarHeaderControls } from "./_components/calendar-header-controls";
import type { TabId } from "./_components/calendar-tabs";
import { CalendarView } from "./_components/calendar-view";
import { ListViewTab } from "./_components/list-view-tab";
import { CalendarLoadingState } from "./_components/page-states";
import { PastEventsTab } from "./_components/past-events-tab";
import { UpcomingTab } from "./_components/upcoming-tab";
import { useEventsCalendar } from "./_components/use-events-calendar";

export default function EventsCalendar() {
  const {
    activeTab,
    setActiveTab,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    selectedDate,
    handleDateClick,
  } = useEventsCalendar();

  // Show loading state
  if (isLoading) {
    return <CalendarLoadingState />;
  }

  return (
    <div className="flex flex-col space-y-6 p-6 max-w-[1600px] mx-auto ">
      {/* Tabbed Interface */}
      <div>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabId)}
          className="space-y-6"
        >
          <CalendarHeaderControls
            isDialogOpen={isDialogOpen}
            onDialogOpenChange={setIsDialogOpen}
            selectedDate={selectedDate}
          />

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6 animate-in fade-in-50 duration-500">
            <CalendarView onDateClick={handleDateClick} />
          </TabsContent>

          {/* List View Tab */}
          <ListViewTab />

          {/* Upcoming Events Tab */}
          <UpcomingTab />

          {/* Past Events Tab */}
          <PastEventsTab />
        </Tabs>
      </div>
    </div>
  );
}
