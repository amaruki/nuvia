"use client";

import * as React from "react";
import { useSafeBack } from "@/lib/hooks/use-safe-back";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Share2, QrCode, Calendar, MapPin, User } from "lucide-react";
import { Event, EventStatus, EventType } from "@/types/event";
import {
  getEventTypeColor,
  getEventStatusColor,
  getRegistrationWindowLabel,
  formatDateLong,
  formatTime,
  formatEventType,
  formatEventStatus,
  formatEventTimeRange,
} from "@/lib/utils/event-utils";

interface EventLayoutProps {
  event: Event;
  isRegistered?: boolean;
  onRegister?: (eventId: string) => void;
  onShare?: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
  showActions?: boolean;
  /**
   * Render inside the dashboard shell, which already provides the page
   * background, container, and h1 (via PageHeader). Strips the standalone
   * chrome — min-h-screen wrapper and inner max-w containers — and demotes
   * the title to h2 so each page keeps a single h1.
   */
  embedded?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function EventLayout({
  event,
  isRegistered = false,
  onRegister,
  onShare,
  onEdit,
  showActions = true,
  embedded = false,
  className,
  children,
}: EventLayoutProps) {
  // Deep-linked visitors have no in-app history; back() would leave the site
  // (UI-24 item 6), so fall back to the events list instead.
  const goBack = useSafeBack("/events");

  /**
   * Register CTA reflects the real registration window (UI-24 item 3): the
   * UI status buckets collapse the DB registration lifecycle into
   * "published", so the CTA reads the propagated registrationWindow. The
   * fallback preserves prior behavior for events built without the window
   * (legacy client-side create flows).
   */
  const registrationWindow =
    event.registrationWindow ?? (event.status === EventStatus.PUBLISHED ? "open" : "closed");
  const canRegister = registrationWindow === "open" && !isRegistered;

  const Heading = embedded ? "h2" : "h1";

  return (
    <div className={cn(!embedded && "min-h-screen bg-background", className)}>
      {/* Event Header */}
      <div className={cn("relative border-b", !embedded && "bg-background")}>
        <div className={cn("py-6", !embedded && "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8")}>
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={goBack} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex flex-wrap gap-2">
              <Badge className={getEventTypeColor(event.eventType)}>
                {formatEventType(event.eventType)}
              </Badge>
              <Badge className={getEventStatusColor(event.status)}>
                {formatEventStatus(event.status)}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <Heading className="mb-2 text-3xl font-bold text-foreground">{event.title}</Heading>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-foreground/60 mb-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>{formatDateLong(event.startDate)}</span>
                </div>

                <div className="flex items-center">
                  <span>{formatEventTimeRange(event.startDate, event.endDate)}</span>
                </div>

                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{event.location}</span>
                </div>
              </div>

              {event.shortDescription && (
                <p className="text-foreground/60 max-w-3xl">{event.shortDescription}</p>
              )}
            </div>

            {showActions && (
              <div className="flex flex-col sm:flex-row gap-3">
                {onRegister && (
                  <div className="flex flex-col gap-1">
                    <Button onClick={() => onRegister(event.id)} disabled={!canRegister}>
                      {isRegistered
                        ? "Registered"
                        : registrationWindow === "open"
                          ? "Register Now"
                          : getRegistrationWindowLabel(registrationWindow)}
                    </Button>
                    {!isRegistered && registrationWindow !== "open" && (
                      <p className="text-muted-foreground text-xs text-center" role="status">
                        {registrationWindow === "live"
                          ? "This event is in progress; registration has closed."
                          : "Registration for this event is closed."}
                      </p>
                    )}
                  </div>
                )}

                {onShare && (
                  <Button variant="outline" onClick={() => onShare(event.id)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                )}

                {onEdit && (
                  <Button variant="outline" onClick={() => onEdit(event.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Content */}
      <main className={cn(!embedded && "flex-1")}>
        <div className={cn("py-8", !embedded && "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8")}>
          {children}
        </div>
      </main>
    </div>
  );
}
