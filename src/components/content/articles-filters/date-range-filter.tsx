"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FiltersControlProps } from "./types";

export function DateRangeFilter({ filters, onFiltersChange }: FiltersControlProps) {
  const clearDateRange = () => {
    onFiltersChange({ dateRange: undefined });
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Date Range</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !filters.dateRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateRange
              ? `${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`
              : "Select date range"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={
              filters.dateRange
                ? { from: filters.dateRange.start, to: filters.dateRange.end }
                : undefined
            }
            onSelect={(range) =>
              onFiltersChange({
                dateRange:
                  range && range.from && range.to
                    ? { start: range.from, end: range.to }
                    : undefined,
              })
            }
          />
        </PopoverContent>
      </Popover>
      {filters.dateRange && (
        <Button variant="ghost" size="sm" onClick={clearDateRange} className="mt-2 w-full">
          <X className="mr-2 h-4 w-4" />
          Clear Date Range
        </Button>
      )}
    </div>
  );
}
