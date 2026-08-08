"use client";

import {
  Calendar,
  CalendarDayView,
  CalendarMonthView,
  CalendarWeekView,
  CalendarYearView,
} from "@/components/ui/full-calendar";
import { id } from "date-fns/locale";

import { convertEventsToCalendarFormat } from "./calendar-data";
import { CalendarToolbar } from "./calendar-toolbar";

interface CalendarViewProps {
  onDateClick: (date: Date) => void;
}

export function CalendarView({ onDateClick }: CalendarViewProps) {
  const calendarEvents = convertEventsToCalendarFormat();

  return (
    <Calendar
      events={calendarEvents}
      defaultDate={new Date()} // Start in current month to show current events
      view="month"
      onDateClick={onDateClick}
      locale={id}
    >
      <div className="h-[75vh] min-h-[600px] flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
        <CalendarToolbar />

        <div className="flex-1 overflow-auto relative">
          <CalendarDayView />
          <CalendarWeekView />
          <CalendarMonthView />
          <CalendarYearView />
        </div>
      </div>
    </Calendar>
  );
}
