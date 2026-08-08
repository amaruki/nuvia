"use client";

import { Button } from "@/components/ui/button";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { forwardRef, useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useCalendar } from "./calendar-context";

const CalendarNextTrigger = forwardRef<HTMLButtonElement, React.HTMLAttributes<HTMLButtonElement>>(
  ({ children, onClick, ...props }, ref) => {
    const { date, setDate, view, enableHotkeys } = useCalendar();

    const next = useCallback(() => {
      if (view === "day") {
        setDate(addDays(date, 1));
      } else if (view === "week") {
        setDate(addWeeks(date, 1));
      } else if (view === "month") {
        setDate(addMonths(date, 1));
      } else if (view === "year") {
        setDate(addYears(date, 1));
      }
    }, [date, view, setDate]);

    useHotkeys("ArrowRight", () => next(), {
      enabled: enableHotkeys,
    });

    return (
      <Button
        size="icon"
        variant="outline"
        className="transition-all duration-200 hover:scale-105 hover:shadow-md"
        ref={ref}
        {...props}
        onClick={(e) => {
          next();
          onClick?.(e);
        }}
      >
        {children}
      </Button>
    );
  },
);
CalendarNextTrigger.displayName = "CalendarNextTrigger";

const CalendarPrevTrigger = forwardRef<HTMLButtonElement, React.HTMLAttributes<HTMLButtonElement>>(
  ({ children, onClick, ...props }, ref) => {
    const { date, setDate, view, enableHotkeys } = useCalendar();

    const prev = useCallback(() => {
      if (view === "day") {
        setDate(subDays(date, 1));
      } else if (view === "week") {
        setDate(subWeeks(date, 1));
      } else if (view === "month") {
        setDate(subMonths(date, 1));
      } else if (view === "year") {
        setDate(subYears(date, 1));
      }
    }, [date, view, setDate]);

    useHotkeys("ArrowLeft", () => prev(), {
      enabled: enableHotkeys,
    });

    return (
      <Button
        size="icon"
        variant="outline"
        className="transition-all duration-200 hover:scale-105 hover:shadow-md"
        ref={ref}
        {...props}
        onClick={(e) => {
          prev();
          onClick?.(e);
        }}
      >
        {children}
      </Button>
    );
  },
);
CalendarPrevTrigger.displayName = "CalendarPrevTrigger";

const CalendarTodayTrigger = forwardRef<HTMLButtonElement, React.HTMLAttributes<HTMLButtonElement>>(
  ({ children, onClick, ...props }, ref) => {
    const { setDate, enableHotkeys, today } = useCalendar();

    useHotkeys("t", () => jumpToToday(), {
      enabled: enableHotkeys,
    });

    const jumpToToday = useCallback(() => {
      setDate(today);
    }, [today, setDate]);

    return (
      <Button
        variant="outline"
        className="transition-all duration-200 hover:shadow-md font-medium"
        ref={ref}
        {...props}
        onClick={(e) => {
          jumpToToday();
          onClick?.(e);
        }}
      >
        {children}
      </Button>
    );
  },
);
CalendarTodayTrigger.displayName = "CalendarTodayTrigger";

export { CalendarNextTrigger, CalendarPrevTrigger, CalendarTodayTrigger };
