"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { useCalendar } from "./calendar-context";
import type { View } from "./types";

const CalendarViewTrigger = forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & {
    view: View;
  }
>(({ children, view, ...props }, ref) => {
  const { view: currentView, setView, onChangeView } = useCalendar();

  return (
    <Button
      aria-current={currentView === view}
      size="sm"
      variant={currentView === view ? "default" : "ghost"}
      className={cn("transition-all duration-200", currentView === view && "shadow-sm")}
      {...props}
      onClick={() => {
        setView(view);
        onChangeView?.(view);
      }}
      ref={ref}
    >
      {children}
    </Button>
  );
});
CalendarViewTrigger.displayName = "CalendarViewTrigger";

export { CalendarViewTrigger };
