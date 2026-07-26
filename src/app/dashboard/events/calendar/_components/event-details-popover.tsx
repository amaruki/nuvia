"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/components/ui/full-calendar";
import { CalendarIcon, Clock, MapPin, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface EventDetailsPopoverProps {
  event: CalendarEvent;
  children: React.ReactNode;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
}

export function EventDetailsPopover({
  event,
  children,
  onEdit,
  onDelete,
}: EventDetailsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className={`h-2 w-full bg-${event.color}-500 rounded-t-md`} />
        <div className="p-4 space-y-4">
          <div>
            <h4 className="font-semibold text-lg leading-none mb-1">{event.title}</h4>
            <p className="text-sm text-muted-foreground">Community Event</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{format(event.start, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Community Center</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit?.(event)}>
              <Edit className="h-3 w-3 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => onDelete?.(event)}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
