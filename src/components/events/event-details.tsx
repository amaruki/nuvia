"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  User, 
  ExternalLink,
  Share2,
  QrCode,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Event, EventStatus, EventType, RegistrationStatus } from "@/types/event.types";

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

const getEventTypeColor = (eventType: EventType): string => {
  switch (eventType) {
    case EventType.WORKSHOP:
      return "bg-chart-1/20 text-chart-1";
    case EventType.MEETUP:
      return "bg-chart-3/20 text-chart-3";
    case EventType.CONFERENCE:
      return "bg-chart-2/20 text-chart-2";
    case EventType.WEBINAR:
      return "bg-chart-5/20 text-chart-5";
    case EventType.SOCIAL:
      return "bg-chart-4/20 text-chart-4";
    case EventType.TRAINING:
      return "bg-destructive/20 text-destructive";
    default:
      return "bg-gray-100 text-foreground/80";
  }
};

const getEventStatusColor = (status: EventStatus): string => {
  switch (status) {
    case EventStatus.DRAFT:
      return "bg-muted text-muted-foreground";
    case EventStatus.PUBLISHED:
      return "bg-chart-3/20 text-chart-3";
    case EventStatus.CANCELLED:
      return "bg-destructive/20 text-destructive";
    case EventStatus.COMPLETED:
      return "bg-chart-1/20 text-chart-1";
    default:
      return "bg-gray-100 text-foreground/80";
  }
};

const getRegistrationStatusColor = (status: RegistrationStatus): string => {
  switch (status) {
    case RegistrationStatus.PENDING:
      return "bg-chart-4/20 text-chart-4";
    case RegistrationStatus.CONFIRMED:
      return "bg-chart-3/20 text-chart-3";
    case RegistrationStatus.CANCELLED:
      return "bg-destructive/20 text-destructive";
    case RegistrationStatus.WAITLISTED:
      return "bg-chart-1/20 text-chart-1";
    default:
      return "bg-gray-100 text-foreground/80";
  }
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const isEventUpcoming = (startDate: Date): boolean => {
  return new Date(startDate) > new Date();
};

const isEventToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

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
  const upcoming = isEventUpcoming(event.startDate);
  const today = isEventToday(event.startDate);

  return (
    <div className={`container mx-auto ${className}`}>
      {/* Event Header */}
      <div className="relative mb-8">
        {event.coverImage && (
          <div className="relative h-64 md:h-80 w-full rounded-xl overflow-hidden">
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={getEventTypeColor(event.eventType)}>
                  {event.eventType.replace('_', ' ')}
                </Badge>
                <Badge className={getEventStatusColor(event.status)}>
                  {event.status.replace('_', ' ')}
                </Badge>
                {today && (
                  <Badge className="bg-chart-1/20 text-chart-1">
                    Today
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {event.title}
              </h1>
              <div className="flex items-center text-white/90">
                <User className="h-5 w-5 mr-2" />
                <span>Organized by {organizerName}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Description */}
          <Card>
            <CardHeader>
              <CardTitle>About this event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground/70 whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-foreground/50 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-foreground/60">
                    {formatDate(event.startDate)}
                  </p>
                  <p className="text-foreground/60">
                    {formatTime(event.startDate)} - {formatTime(event.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-foreground/50 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-foreground/60">{event.location}</p>
                  {event.isVirtual && event.virtualEventUrl && (
                    <a 
                      href={event.virtualEventUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 text-sm flex items-center mt-1"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Virtual Event Link
                    </a>
                  )}
                </div>
              </div>

              {event.maxAttendees && (
                <div className="flex items-start">
                  <Users className="h-5 w-5 text-foreground/50 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Attendees</p>
                    <p className="text-foreground/60">
                      {event.currentAttendees} of {event.maxAttendees} spots filled
                    </p>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div
                        className="bg-chart-1 h-2 rounded-full"
                        style={{ 
                          width: `${(event.currentAttendees / event.maxAttendees) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {event.registrationDeadline && (
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-foreground/50 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Registration Deadline</p>
                    <p className="text-foreground/60">
                      {formatDate(event.registrationDeadline)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Tags */}
          {event.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Card */}
          <Card>
            <CardHeader>
              <CardTitle>Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isRegistered && registrationStatus && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Your Status:</span>
                  <Badge className={getRegistrationStatusColor(registrationStatus)}>
                    {registrationStatus.replace('_', ' ')}
                  </Badge>
                </div>
              )}

              <div className="space-y-3">
                {upcoming && event.status === EventStatus.PUBLISHED && (
                  <>
                    {!isRegistered ? (
                      <Button 
                        onClick={() => onRegister?.(event.id)}
                        className="w-full"
                        disabled={event.maxAttendees !== undefined && event.currentAttendees >= event.maxAttendees}
                      >
                        Register for this event
                      </Button>
                    ) : (
                      <>
                        {registrationStatus === RegistrationStatus.CONFIRMED && today && (
                          <Button 
                            onClick={() => onCheckIn?.(event.id)}
                            variant="outline"
                            className="w-full"
                          >
                            <QrCode className="h-4 w-4 mr-2" />
                            Check In
                          </Button>
                        )}
                        <Button 
                          onClick={() => onCancelRegistration?.(event.id)}
                          variant="outline"
                          className="w-full"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Registration
                        </Button>
                      </>
                    )}
                  </>
                )}

                {!upcoming && isRegistered && registrationStatus === RegistrationStatus.CONFIRMED && (
                  <div className="flex items-center justify-center p-3 bg-chart-3/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-chart-3 mr-2" />
                    <span className="text-chart-3 text-sm font-medium">
                      You attended this event
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => onShare?.(event.id)}
                variant="outline"
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Event
              </Button>
              
              {onEdit && (
                <Button 
                  onClick={() => onEdit?.(event.id)}
                  variant="outline"
                  className="w-full"
                >
                  Edit Event
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}