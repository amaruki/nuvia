"use client";

import { format } from "date-fns";
import { useCalendar } from "./calendar-context";

const CalendarCurrentDate = () => {
  const { date, view } = useCalendar();

  return (
    <time dateTime={date.toISOString()} className="tabular-nums font-semibold text-lg">
      {format(date, view === "day" ? "dd MMMM yyyy" : "MMMM yyyy")}
    </time>
  );
};

export { CalendarCurrentDate };
