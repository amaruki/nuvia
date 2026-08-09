import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ExternalLink, MapPin, Users } from "lucide-react";
import { Event } from "@/types/event";
import { formatDate, formatTime } from "./utils";

interface EventDetailsInfoProps {
  event: Event;
}

export function EventDetailsInfo({ event }: EventDetailsInfoProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Event Description */}
      <Card>
        <CardHeader>
          <CardTitle>About this event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground/70 whitespace-pre-line">{event.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start">
            <Calendar className="h-5 w-5 text-foreground/50 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">Date & Time</p>
              <p className="text-foreground/60">{formatDate(event.startDate)}</p>
              <p className="text-foreground/60">
                {formatTime(event.startDate)} - {formatTime(event.endDate)}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <MapPin className="h-5 w-5 text-foreground/50 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">Location</p>
              <p className="text-foreground/60">{event.location}</p>
              {event.isVirtual && event.virtualEventUrl && (
                <a
                  href={event.virtualEventUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-sm flex items-center mt-1"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Virtual Event Link
                </a>
              )}
            </div>
          </div>

          {event.maxAttendees && (
            <div className="flex items-start">
              <Users className="h-5 w-5 text-foreground/50 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">Attendees</p>
                <p className="text-foreground/60">
                  {event.currentAttendees} of {event.maxAttendees} spots filled
                </p>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className="bg-chart-1 h-2 rounded-full"
                    style={{
                      width: `${(event.currentAttendees / event.maxAttendees) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {event.registrationDeadline && (
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-foreground/50 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">Registration Deadline</p>
                <p className="text-foreground/60">{formatDate(event.registrationDeadline)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Tags */}
      {event.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
