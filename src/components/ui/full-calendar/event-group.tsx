import { EventDetailsPopover } from "@/app/dashboard/events/calendar/_components/event-details-popover";
import { cn } from "@/lib/utils";
import { differenceInMinutes, format, isSameHour } from "date-fns";
import { dayEventVariants } from "./event-variants";
import type { CalendarEvent } from "./types";

const EventGroup = ({ events, hour }: { events: CalendarEvent[]; hour: Date }) => {
  return (
    <div className="h-20 border-t last:border-b relative">
      {events
        .filter((event) => isSameHour(event.start, hour))
        .map((event) => {
          const hoursDifference = differenceInMinutes(event.end, event.start) / 60;
          const startPosition = event.start.getMinutes() / 60;

          return (
            <EventDetailsPopover key={event.id} event={event}>
              <button
                type="button"
                className={cn(
                  "absolute text-left cursor-pointer overflow-hidden z-10",
                  dayEventVariants({ variant: event.color }),
                )}
                style={{
                  top: `${startPosition * 100}%`,
                  height: `${Math.max(hoursDifference * 100, 25)}%`,
                  left: "4px",
                  right: "4px",
                }}
              >
                <span className="block font-semibold truncate">{event.title}</span>
                <span className="block text-[10px] opacity-75 mt-0.5">
                  {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                </span>
              </button>
            </EventDetailsPopover>
          );
        })}
    </div>
  );
};

export { EventGroup };
