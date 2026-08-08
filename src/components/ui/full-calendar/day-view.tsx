"use client";

import { setHours } from "date-fns";
import { useCalendar } from "./calendar-context";
import { EventGroup } from "./event-group";
import { TimeTable } from "./time-table";

const CalendarDayView = () => {
  const { view, events, date } = useCalendar();

  if (view !== "day") return null;

  const hours = [...Array(24)].map((_, i) => setHours(date, i));

  return (
    <div className="flex relative pt-2 overflow-auto h-full">
      <TimeTable />
      <div className="flex-1">
        {hours.map((hour) => (
          <EventGroup key={hour.toString()} hour={hour} events={events} />
        ))}
      </div>
    </div>
  );
};

export { CalendarDayView };
