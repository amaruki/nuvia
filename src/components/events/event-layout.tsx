"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Share2, QrCode, Calendar, MapPin, User } from "lucide-react";
import { Event, EventStatus, EventType } from "@/types/event.types";
import {
  getEventTypeColor,
  getEventStatusColor,
  formatDateLong,
  formatTime,
  formatEventType,
  formatEventStatus,
  formatEventTimeRange
} from "@/lib/utils/event-utils";

interface EventLayoutProps {
  event: Event;
  isRegistered?: boolean;
  onRegister?: (eventId: string) => void;
  onShare?: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
  showActions?: boolean;
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
  className,
  children,
}: EventLayoutProps) {
  const router = useRouter();
  
  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Event Header */}
      <div className="relative bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="mr-4"
            >
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
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {event.title}
              </h1>
              
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
                <p className="text-foreground/60 max-w-3xl">
                  {event.shortDescription}
                </p>
              )}
            </div>
            
            {showActions && (
              <div className="flex flex-col sm:flex-row gap-3">
                {onRegister && (
                  <Button
                    onClick={() => onRegister(event.id)}
                    disabled={event.status !== EventStatus.PUBLISHED || isRegistered}
                  >
                    {isRegistered ? "Registered" : "Register Now"}
                  </Button>
                )}
                
                {onShare && (
                  <Button
                    variant="outline"
                    onClick={() => onShare(event.id)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                )}
                
                {onEdit && (
                  <Button
                    variant="outline"
                    onClick={() => onEdit(event.id)}
                  >
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
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}