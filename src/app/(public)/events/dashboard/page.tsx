"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import type { EventDashboardData } from "@/types/event";
import { getEventDashboardData } from "@/lib/services/event";
import { EventListLayout } from "@/components/events/event-list-layout";
import { DashboardErrorState, DashboardLoadingState } from "./_components/page-states";
import { StatisticsCards } from "./_components/statistics-cards";
import { UpcomingEventsCard } from "./_components/upcoming-events-card";
import { MyRegistrationsCard } from "./_components/my-registrations-card";
import { MyEventsCard } from "./_components/my-events-card";

export default function EventDashboardPage() {
  const [dashboardData, setDashboardData] = React.useState<EventDashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch dashboard data
        const data = await getEventDashboardData();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (error || !dashboardData) {
    return <DashboardErrorState message={error} />;
  }

  const { upcomingEvents, myEvents, myRegistrations, eventStatistics } = dashboardData;

  return (
    <EventListLayout
      title="Event Dashboard"
      description="Overview of your events and activities"
      icon={<Calendar className="h-8 w-8 text-primary" />}
    >
      <div className="flex justify-end mb-8">
        <Button onClick={() => (window.location.href = "/dashboard/events?form=new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      <StatisticsCards statistics={eventStatistics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UpcomingEventsCard events={upcomingEvents} />
        <MyRegistrationsCard registrations={myRegistrations} />
      </div>

      {myEvents.length > 0 && <MyEventsCard events={myEvents} />}
    </EventListLayout>
  );
}
