"use client";

import { cn } from "@/lib/utils";
import { format, getMonth, isSameDay, setMonth } from "date-fns";
import { useMemo } from "react";
import { useCalendar } from "./calendar-context";
import { getDaysInMonth, generateWeekdays } from "./date-grid";
import { monthEventVariants } from "./event-variants";

const CalendarYearView = () => {
  const { view, date, today, locale, events } = useCalendar();

  const months = useMemo(() => {
    if (!view) {
      return [];
    }

    return Array.from({ length: 12 }).map((_, i) => {
      return getDaysInMonth(setMonth(date, i));
    });
  }, [date, view]);

  const weekDays = useMemo(() => generateWeekdays(locale), [locale]);

  if (view !== "year") return null;

  return (
    <div className="grid grid-cols-3 lg:grid-cols-4 gap-8 overflow-auto h-full p-6">
      {months.map((days, i) => (
        <div
          key={days[0].toString()}
          className="bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <span className="text-lg font-bold text-foreground block mb-3">
            {format(setMonth(date, i), "MMMM", { locale })}
          </span>

          {/* Day-of-week header row. UI-11 acceptance rule (docs/planning/
              03-frontend-improvement-plan.md, Phase 4: "zero text-[10px]
              outside calendar day-of-week headers — if kept, documented")
              permits keeping text-[10px] here and only here: these are the
              abbreviated weekday column headers repeated 12x across the year
              grid's mini-months. All other calendar text-[10px] sites
              (event-group, month-view) were raised to 11px. */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-semibold text-muted-foreground uppercase"
              >
                {day.substring(0, 3)}
              </div>
            ))}
          </div>

          <div className="grid gap-1 text-center grid-cols-7 text-xs tabular-nums">
            {days.map((_date) => {
              const hasEvents = events.some((event) => isSameDay(event.start, _date));
              const dayEvents = events.filter((event) => isSameDay(event.start, _date));

              return (
                <div
                  key={_date.toString()}
                  className={cn(
                    "transition-colors duration-200 relative",
                    getMonth(_date) !== i && "text-muted-foreground/40",
                  )}
                >
                  <div
                    className={cn(
                      "aspect-square grid place-content-center size-full tabular-nums rounded-md hover:bg-muted/50 transition-all duration-200 cursor-pointer relative",
                      isSameDay(today, _date) &&
                        getMonth(_date) === i &&
                        "bg-primary text-primary-foreground font-bold shadow-md hover:shadow-lg hover:scale-110",
                    )}
                  >
                    {format(_date, "d")}
                    {hasEvents && getMonth(_date) === i && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "size-1 rounded-full",
                              monthEventVariants({ variant: event.color }),
                            )}
                            title={event.title}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="size-1 rounded-full bg-muted-foreground/50" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export { CalendarYearView };
