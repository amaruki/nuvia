"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ExternalLink } from "lucide-react";
import { formatDate, formatTime } from "./utils";
import type { RecommendedEventCardProps } from "./types";

export function RecommendedEventCard({ event, onRegisterForEvent }: RecommendedEventCardProps) {
  return (
    <div className="p-3 rounded-lg border bg-card border-border">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 className="text-sm font-semibold text-foreground/90 line-clamp-1">{event.title}</h5>

          <p className="text-sm text-foreground/60 mb-2 line-clamp-2">{event.description}</p>
        </div>
      </div>

      {/* Event metadata */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center text-xs text-foreground/50">
          <Calendar className="h-3 w-3 mr-2" />
          <span>{formatDate(new Date(event.startDate))}</span>
        </div>

        <div className="flex items-center text-xs text-foreground/50">
          <Clock className="h-3 w-3 mr-2" />
          <span>
            {formatTime(new Date(event.startDate))} - {formatTime(new Date(event.endDate))}
          </span>
        </div>

        <div className="flex items-center text-xs text-foreground/50">
          <span className="inline-block w-3 h-3 mr-2 rounded-full bg-muted-foreground"></span>
          <span>{event.location}</span>
        </div>
      </div>

      {/* Event actions */}
      <div className="flex items-center justify-between">
        {event.isRegistered ? (
          <Badge className="bg-chart-3/20 text-chart-3">Registered</Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRegisterForEvent?.(event.id)}
            className="text-xs"
          >
            Register Now
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRegisterForEvent?.(event.id)}
          className="text-xs"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Details
        </Button>
      </div>
    </div>
  );
}
