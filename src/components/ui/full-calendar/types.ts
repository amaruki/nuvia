import { type VariantProps } from "class-variance-authority";
import { type Locale } from "date-fns";
import { type ReactNode } from "react";
import { monthEventVariants } from "./event-variants";

type View = "day" | "week" | "month" | "year";

type ContextType = {
  view: View;
  setView: (view: View) => void;
  date: Date;
  setDate: (date: Date) => void;
  events: CalendarEvent[];
  locale: Locale;
  setEvents: (date: CalendarEvent[]) => void;
  onChangeView?: (view: View) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  enableHotkeys?: boolean;
  today: Date;
};

type CalendarEvent = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  color?: VariantProps<typeof monthEventVariants>["variant"];
};

type CalendarProps = {
  children: ReactNode;
  defaultDate?: Date;
  events?: CalendarEvent[];
  view?: View;
  locale?: Locale;
  enableHotkeys?: boolean;
  onChangeView?: (view: View) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
};

export type { View, ContextType, CalendarEvent, CalendarProps };
