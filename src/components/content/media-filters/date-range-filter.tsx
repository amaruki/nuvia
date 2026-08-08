"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { FilterControlProps } from "./types";

export function DateRangeFilter({ filters, onFiltersChange }: FilterControlProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label className="text-sm font-medium">From Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !filters.dateRange?.start && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange?.start ? format(filters.dateRange.start, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.dateRange?.start}
              onSelect={(date) => {
                const newRange = {
                  start: date || new Date(),
                  end: filters.dateRange?.end || new Date(),
                };
                onFiltersChange({ ...filters, dateRange: newRange });
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">To Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !filters.dateRange?.end && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange?.end ? format(filters.dateRange.end, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.dateRange?.end}
              onSelect={(date) => {
                const newRange = {
                  start: filters.dateRange?.start || new Date(),
                  end: date || new Date(),
                };
                onFiltersChange({ ...filters, dateRange: newRange });
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
