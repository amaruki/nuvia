"use client";

import { EventDetailsPopover } from "@/app/dashboard/events/calendar/_components/event-details-popover";
import { cn } from "@/lib/utils";
import { format, isSameDay, isSameMonth, isToday } from "date-fns";
import { useMemo } from "react";
import { useCalendar } from "./calendar-context";
import { getDaysInMonth, generateWeekdays } from "./date-grid";
import { monthEventVariants } from "./event-variants";

const CalendarMonthView = () => {
  const { date, view, events, locale, onDateClick } = useCalendar();

  const monthDates = useMemo(() => getDaysInMonth(date), [date]);
  const weekDays = useMemo(() => generateWeekdays(locale), [locale]);

  if (view !== "month") return null;

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 gap-px sticky top-0 bg-background border-b z-10 shadow-sm">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid overflow-hidden -mt-px flex-1 auto-rows-fr p-px grid-cols-7 gap-px bg-muted/30">
        {monthDates.map((_date) => {
          const currentEvents = events.filter((event) => isSameDay(event.start, _date));

          return (
            <div
              className={cn(
                "bg-card p-2 text-sm text-muted-foreground overflow-auto transition-all duration-200 hover:shadow-md hover:z-10 hover:scale-[1.02]",
                !isSameMonth(date, _date) && "bg-muted/20",
              )}
              key={_date.toString()}
            >
              {isSameMonth(date, _date) ? (
                <button
                  type="button"
                  onClick={() => onDateClick?.(_date)}
                  aria-label={`Create event on ${format(_date, "EEEE, d MMMM")}`}
                  className={cn(
                    "size-7 grid place-items-center rounded-full mb-2 sticky top-0 font-semibold transition-all duration-200 cursor-pointer",
                    isToday(_date) &&
                      "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20",
                  )}
                >
                  {format(_date, "d")}
                </button>
              ) : (
                <div className="size-7 grid place-items-center rounded-full mb-2 sticky top-0 font-semibold transition-all duration-200">
                  {format(_date, "d")}
                </div>
              )}

              <div className="space-y-1">
                {currentEvents.map((event) => {
                  return (
                    <EventDetailsPopover key={event.id} event={event}>
                      <button
                        type="button"
                        className="w-full text-left px-2 py-1 rounded-md text-xs flex items-center gap-2 cursor-pointer transition-all duration-200 hover:shadow-sm group"
                      >
                        <span
                          className={cn(
                            "inline-block shrink-0 transition-transform duration-200 group-hover:scale-125",
                            monthEventVariants({ variant: event.color }),
                          )}
                        ></span>
                        <span className="flex-1 truncate font-medium">{event.title}</span>
                        <time className="tabular-nums text-muted-foreground text-[10px]">
                          {format(event.start, "HH:mm")}
                        </time>
                      </button>
                    </EventDetailsPopover>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { CalendarMonthView };
