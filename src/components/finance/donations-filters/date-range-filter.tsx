"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRangeFilterProps } from "./types";

export function DateRangeFilter({ initialStart, initialEnd, onRangeChange }: DateRangeFilterProps) {
  const [dateRange, setDateRange] = useState<{
    start?: Date;
    end?: Date;
  }>({
    start: initialStart,
    end: initialEnd,
  });

  return (
    <div className="space-y-2">
      <Label>Date Range</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange.start && !dateRange.end && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.start ? (
              dateRange.end ? (
                <>
                  {format(dateRange.start, "LLL dd, y")} - {format(dateRange.end, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.start, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={dateRange.start}
            selected={{
              from: dateRange.start,
              to: dateRange.end,
            }}
            onSelect={(range) => {
              const next = { start: range?.from, end: range?.to };
              setDateRange(next);
              onRangeChange(next);
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
