"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_TARGET_AUDIENCES,
  ANNOUNCEMENT_TYPE_DISPLAY,
  ANNOUNCEMENT_PRIORITY_DISPLAY,
  ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY,
} from "@/types/announcement.types";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { FiltersControlProps } from "./types";
import { toggleArrayFilterValue } from "./filter-helpers";

export function AnnouncementSpecificFilters({ filters, onFiltersChange }: FiltersControlProps) {
  return (
    <>
      {/* Type */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Type</Label>
        <div className="flex flex-wrap gap-2">
          {ANNOUNCEMENT_TYPES.map((type) => {
            const display = ANNOUNCEMENT_TYPE_DISPLAY[type];
            return (
              <Badge
                key={type}
                variant={filters.type?.includes(type) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() =>
                  onFiltersChange({ type: toggleArrayFilterValue(filters.type, type) })
                }
              >
                {display.name}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Priority */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Priority</Label>
        <div className="flex flex-wrap gap-2">
          {ANNOUNCEMENT_PRIORITIES.map((priority) => {
            const display = ANNOUNCEMENT_PRIORITY_DISPLAY[priority];
            return (
              <Badge
                key={priority}
                variant={filters.priority?.includes(priority) ? display.badgeVariant : "outline"}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() =>
                  onFiltersChange({ priority: toggleArrayFilterValue(filters.priority, priority) })
                }
              >
                {display.name}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Target Audience */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Target Audience</Label>
        <div className="flex flex-wrap gap-2">
          {ANNOUNCEMENT_TARGET_AUDIENCES.map((audience) => {
            const display = ANNOUNCEMENT_TARGET_AUDIENCE_DISPLAY[audience];
            return (
              <Badge
                key={audience}
                variant={filters.targetAudience?.includes(audience) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() =>
                  onFiltersChange({
                    targetAudience: toggleArrayFilterValue(filters.targetAudience, audience),
                  })
                }
              >
                {display.name}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Expiration Date */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Expiration Date</Label>
        <div className="grid grid-cols-2 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.expiresAt?.start
                  ? format(filters.expiresAt.start, "MMM dd, yyyy")
                  : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.expiresAt?.start}
                onSelect={(date) =>
                  onFiltersChange({
                    expiresAt: {
                      ...filters.expiresAt,
                      start: date,
                    },
                  })
                }
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.expiresAt?.end
                  ? format(filters.expiresAt.end, "MMM dd, yyyy")
                  : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.expiresAt?.end}
                onSelect={(date) =>
                  onFiltersChange({
                    expiresAt: {
                      ...filters.expiresAt,
                      end: date,
                    },
                  })
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </>
  );
}
