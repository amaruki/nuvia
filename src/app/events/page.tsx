"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { EventList, EventFilter } from "@/components/events";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Calendar, SortAsc, SortDesc } from "lucide-react";

import { EventListLayout } from "@/components/events/event-list-layout";
import { useEvents, useEventFilters } from "@/lib/hooks/use-events";
import { formatDate } from "@/lib/utils/date-utils";

export default function EventsPage() {
  const router = useRouter();
  const [showFilters, setShowFilters] = React.useState(false);  
  
  

  const handleCreateEvent = () => {
    router.push("/events/create");
  };

  const handleRegister = (eventId: string) => {
    router.push(`/events/${eventId}/register`);
  };

  const handleViewDetails = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };



  // Create event button to be placed next to the title
  const createEventButton = (
    <Button onClick={handleCreateEvent} className="h-9">
      <Plus className="h-4 w-4 mr-2" />
      Create Event
    </Button>
  );

  return (
    <EventListLayout
      title="Events"
      description="Discover and join events that match your interests"
      icon={<Calendar className="h-8 w-8 text-primary" />}
      
      topRightActions={createEventButton}
    >


      <EventList
        onCreateEvent={handleCreateEvent}
        onRegister={handleRegister}
        onViewDetails={handleViewDetails}
        showCreateButton={false}
        showRegistrationStatus={true} 
        events={[]}      />
    </EventListLayout>
  );
}