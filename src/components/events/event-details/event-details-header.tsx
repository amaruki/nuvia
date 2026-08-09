import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { Event } from "@/types/event";
import { getEventStatusColor, getEventTypeColor } from "./utils";

interface EventDetailsHeaderProps {
  event: Event;
  organizerName: string;
  today: boolean;
}

export function EventDetailsHeader({ event, organizerName, today }: EventDetailsHeaderProps) {
  return (
    <div className="relative mb-8">
      {event.coverImage && (
        <div className="relative h-64 md:h-80 w-full rounded-xl overflow-hidden">
          <Image src={event.coverImage} alt={event.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={getEventTypeColor(event.eventType)}>
                {event.eventType.replace("_", " ")}
              </Badge>
              <Badge className={getEventStatusColor(event.status)}>
                {event.status.replace("_", " ")}
              </Badge>
              {today && <Badge className="bg-chart-1/20 text-chart-1">Today</Badge>}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.title}</h1>
            <div className="flex items-center text-white/90">
              <User className="h-5 w-5 mr-2" />
              <span>Organized by {organizerName}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
