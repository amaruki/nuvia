"use client";

import { Event, RegistrationStatus } from "@/types/event";
import { EventDetailsHeader } from "./event-details-header";
import { EventDetailsInfo } from "./event-details-info";
import { EventDetailsSidebar } from "./event-details-sidebar";

interface EventDetailsProps {
  event: Event;
  isRegistered?: boolean;
  registrationStatus?: RegistrationStatus;
  organizerName?: string;
  onRegister?: (eventId: string) => void;
  onCancelRegistration?: (eventId: string) => void;
  onCheckIn?: (eventId: string) => void;
  onShare?: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
  className?: string;
}

export function EventDetails({
  event,
  isRegistered = false,
  registrationStatus,
  organizerName = "Event Organizer",
  onRegister,
  onCancelRegistration,
  onCheckIn,
  onShare,
  onEdit,
  className = "",
}: EventDetailsProps) {
  const now = new Date();
  const upcoming = new Date(event.startDate) > now;
  const today =
    event.startDate.getDate() === now.getDate() &&
    event.startDate.getMonth() === now.getMonth() &&
    event.startDate.getFullYear() === now.getFullYear();

  return (
    <div className={`container mx-auto ${className}`}>
      {/* Event Header */}
      <EventDetailsHeader event={event} organizerName={organizerName} today={today} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <EventDetailsInfo event={event} />

        {/* Sidebar */}
        <EventDetailsSidebar
          event={event}
          isRegistered={isRegistered}
          registrationStatus={registrationStatus}
          upcoming={upcoming}
          today={today}
          onRegister={onRegister}
          onCancelRegistration={onCancelRegistration}
          onCheckIn={onCheckIn}
          onShare={onShare}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}
