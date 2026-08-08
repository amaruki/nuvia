"use client";

import {
  CalendarCurrentDate,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarViewTrigger,
} from "@/components/ui/full-calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";

const viewTriggerClassName =
  "h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all";

export function CalendarToolbar() {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-muted/30">
      <div className="flex items-center gap-2">
        <CalendarViewTrigger className={viewTriggerClassName} view="day">
          Day
        </CalendarViewTrigger>
        <CalendarViewTrigger view="week" className={viewTriggerClassName}>
          Week
        </CalendarViewTrigger>
        <CalendarViewTrigger view="month" className={viewTriggerClassName}>
          Month
        </CalendarViewTrigger>
        <CalendarViewTrigger view="year" className={viewTriggerClassName}>
          Year
        </CalendarViewTrigger>
      </div>
      <div className="ml-4 text-lg font-semibold">
        <CalendarCurrentDate />
      </div>

      <div className="flex items-center gap-1 p-1">
        <CalendarPrevTrigger className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </CalendarPrevTrigger>

        <CalendarTodayTrigger className="h-8 px-3 text-xs">Today</CalendarTodayTrigger>

        <CalendarNextTrigger className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </CalendarNextTrigger>
      </div>
    </div>
  );
}
