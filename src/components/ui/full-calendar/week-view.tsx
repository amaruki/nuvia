"use client";

import { cn } from "@/lib/utils";
import { addDays, format, isToday, setHours, startOfWeek } from "date-fns";
import { useMemo } from "react";
import { useCalendar } from "./calendar-context";
import { EventGroup } from "./event-group";
import { TimeTable } from "./time-table";

const CalendarWeekView = () => {
  const { view, date, locale, events } = useCalendar();

  const weekDates = useMemo(() => {
    const start = startOfWeek(date, { weekStartsOn: 0 });
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i);
      const hours = [...Array(24)].map((_, i) => setHours(day, i));
      weekDates.push(hours);
    }

    return weekDates;
  }, [date]);

  const headerDays = useMemo(() => {
    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
      const result = addDays(startOfWeek(date, { weekStartsOn: 0 }), i);
      daysOfWeek.push(result);
    }
    return daysOfWeek;
  }, [date]);

  if (view !== "week") return null;

  return (
    <div className="flex flex-col relative overflow-auto h-full">
      <div className="flex sticky top-0 bg-card z-10 border-b mb-3 shadow-sm">
        <div className="w-16"></div>
        {headerDays.map((date, i) => (
          <div
            key={date.toString()}
            className={cn(
              "text-center flex-1 gap-1 py-3 text-sm font-medium flex flex-col items-center justify-center transition-colors",
              [0, 6].includes(i) && "text-muted-foreground/70",
            )}
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {format(date, "EEEE", { locale })}
            </div>
            <span
              className={cn(
                "h-8 w-8 grid place-content-center font-semibold transition-all duration-200",
                isToday(date) &&
                  "bg-primary text-primary-foreground rounded-full shadow-md scale-110",
              )}
            >
              {format(date, "d")}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-1">
        <div className="w-fit">
          <TimeTable />
        </div>
        <div className="grid grid-cols-7 flex-1">
          {weekDates.map((hours, i) => {
            return (
              <div
                className={cn(
                  "h-full text-sm text-muted-foreground border-l first:border-l-0 transition-colors",
                  [0, 6].includes(i) && "bg-muted/30",
                )}
                key={hours[0].toString()}
              >
                {hours.map((hour) => (
                  <EventGroup key={hour.toString()} hour={hour} events={events} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { CalendarWeekView };
