"use client";

/**
 * Month/week/day/year calendar fed by real events from the server page.
 * Event colors reflect the UI event status; no locale override is applied,
 * so the full-calendar component uses its default (working) date handling.
 */

import {
  Calendar,
  CalendarDayView,
  CalendarMonthView,
  CalendarWeekView,
  CalendarYearView,
  type CalendarEvent,
} from "@/components/ui/full-calendar";

import type { CalendarEventDto } from "./calendar-event-dto";
import { CalendarToolbar } from "./calendar-toolbar";

/** Calendar color per UI EventStatus value. */
const STATUS_COLORS: Record<string, CalendarEvent["color"]> = {
  draft: "default",
  published: "blue",
  cancelled: "red",
  completed: "green",
};

function toCalendarEvent(dto: CalendarEventDto): CalendarEvent {
  return {
    id: dto.id,
    start: new Date(dto.startDate),
    end: new Date(dto.endDate),
    title: dto.title,
    color: STATUS_COLORS[dto.status] ?? "default",
  };
}

interface CalendarViewProps {
  events: CalendarEventDto[];
}

export function CalendarView({ events }: CalendarViewProps) {
  const calendarEvents = events.map(toCalendarEvent);

  return (
    <Calendar events={calendarEvents} defaultDate={new Date()} view="month">
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
