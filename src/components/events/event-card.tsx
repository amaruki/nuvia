"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, ExternalLink, User } from "lucide-react";
import { Event, EventStatus, EventType } from "@/types/event";
import {
  getEventTypeColor,
  getEventStatusColor,
  formatDate,
  formatTime,
  isEventUpcoming,
  isEventToday,
  isEventTomorrow,
  formatEventType,
  formatEventStatus,
  formatEventTimeRange,
} from "@/lib/utils/event-utils";

interface EventCardProps {
  event: Event;
  isRegistered?: boolean;
  showRegistrationStatus?: boolean;
  onRegister?: (eventId: string) => void;
  onViewDetails?: (eventId: string) => void;
  className?: string;
}

const EventCard = React.memo(function EventCard({
  event,
  isRegistered = false,
  showRegistrationStatus = false,
  onRegister,
  onViewDetails,
  className = "",
}: EventCardProps) {
  const upcoming = isEventUpcoming(event.startDate);
  const today = isEventToday(event.startDate);
  const tomorrow = isEventTomorrow(event.startDate);

  // Memoize event details to prevent unnecessary recalculations
  const eventDetails = React.useMemo(
    () => ({
      formattedDate: formatDate(event.startDate),
      formattedTimeRange: formatEventTimeRange(event.startDate, event.endDate),
      eventTypeColor: getEventTypeColor(event.eventType),
      eventStatusColor: getEventStatusColor(event.status),
      formattedEventType: formatEventType(event.eventType),
      formattedEventStatus: formatEventStatus(event.status),
      attendeeText: event.maxAttendees
        ? `${event.currentAttendees} of ${event.maxAttendees} attendees`
        : null,
      canRegister: upcoming && !isRegistered && event.status === EventStatus.PUBLISHED,
    }),
    [event, upcoming, isRegistered],
  );

  // Memoize badge elements
  const badges = React.useMemo(() => {
    const badgesArray = [
      <Badge key="type" className={eventDetails.eventTypeColor}>
        {eventDetails.formattedEventType}
      </Badge>,
      <Badge key="status" className={eventDetails.eventStatusColor}>
        {eventDetails.formattedEventStatus}
      </Badge>,
    ];

    if (today) {
      badgesArray.push(
        <Badge key="today" className="bg-chart-1/20 text-chart-1">
          Today
        </Badge>,
      );
    }

    if (tomorrow) {
      badgesArray.push(
        <Badge key="tomorrow" className="bg-chart-2/20 text-chart-2">
          Tomorrow
        </Badge>,
      );
    }

    return badgesArray;
  }, [today, tomorrow, eventDetails]);

  // Memoize tag elements
  const tagElements = React.useMemo(() => {
    if (event.tags.length === 0) return null;

    const tags = event.tags.slice(0, 3).map((tag, index) => (
      <Badge key={index} variant="outline" className="text-xs">
        {tag}
      </Badge>
    ));

    if (event.tags.length > 3) {
      tags.push(
        <Badge key="more" variant="outline" className="text-xs">
          +{event.tags.length - 3} more
        </Badge>,
      );
    }

    return (
      <div className="flex flex-wrap gap-1 pt-1" aria-label="Event tags">
        {tags}
      </div>
    );
  }, [event.tags]);

  // Memoize registration status badge
  const registrationStatusBadge = React.useMemo(() => {
    if (!showRegistrationStatus) return null;

    return (
      <div className="w-full sm:w-auto">
        {isRegistered ? (
          <Badge className="bg-chart-3/20 text-chart-3 w-full sm:w-auto justify-center">
            Registered
          </Badge>
        ) : (
          <Badge variant="outline" className="text-foreground/50 w-full sm:w-auto justify-center">
            Not registered
          </Badge>
        )}
      </div>
    );
  }, [showRegistrationStatus, isRegistered]);

  // Memoize action buttons
  const actionButtons = React.useMemo(() => {
    const buttons = [];

    if (eventDetails.canRegister && onRegister) {
      buttons.push(
        <Button
          key="register"
          size="sm"
          onClick={() => onRegister(event.id)}
          className="w-full sm:w-auto"
          aria-label={`Register for ${event.title}`}
        >
          Register
        </Button>,
      );
    }

    buttons.push(
      <Button key="details" variant="outline" size="sm" asChild className="w-full sm:w-auto">
        <Link href={`/events/${event.id}`} aria-label={`View details for ${event.title}`}>
          <ExternalLink className="h-3 w-3 mr-1" />
          Details
        </Link>
      </Button>,
    );

    return (
      <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 w-full sm:w-auto">
        {buttons}
      </div>
    );
  }, [eventDetails.canRegister, onRegister, event.title, onViewDetails]);

  return (
    <Card
      className={`py-0 overflow-hidden transition-all duration-200 hover:shadow-lg ${className}`}
    >
      {/* Event Cover Image */}
      <div className="relative h-48 w-full sm:h-56 md:h-64 bg-primary/10">
        {event.coverImage ? (
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="h-16 w-16 text-primary/60" />
          </div>
        )}
        <div className="absolute inset-0" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 max-w-[90%]">{badges}</div>
      </div>

      <CardContent className="p-4 sm:p-5">
        <div className="space-y-3">
          {/* Event Title */}
          <h5 className="text-lg font-semibold text-foreground line-clamp-2">{event.title}</h5>

          {/* Event Short Description */}
          {event.shortDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2">{event.shortDescription}</p>
          )}

          {/* Event Details */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0 text-primary" aria-hidden="true" />
              <span>{eventDetails.formattedDate}</span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2 flex-shrink-0 text-primary" aria-hidden="true" />
              <span>{eventDetails.formattedTimeRange}</span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-primary" aria-hidden="true" />
              <span className="line-clamp-1">{event.location}</span>
            </div>

            {eventDetails.attendeeText && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-2 flex-shrink-0 text-primary" aria-hidden="true" />
                <span>{eventDetails.attendeeText}</span>
              </div>
            )}
          </div>

          {/* Event Tags */}
          {tagElements}
        </div>
      </CardContent>

      <CardFooter className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Registration Status */}
        {registrationStatusBadge}

        {/* Action Buttons */}
        {actionButtons}
      </CardFooter>
    </Card>
  );
});

EventCard.displayName = "EventCard";

export { EventCard };
