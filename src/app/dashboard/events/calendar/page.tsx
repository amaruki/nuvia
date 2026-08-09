/**
 * Events calendar — server page (plan item UI-03).
 *
 * Loads real events from the event read service (drizzle direct, server
 * component per ADR-0006) and hands serialized DTOs to the client shell.
 * Upcoming = events starting from now onward; past = events already started,
 * newest first. Nothing here is sampled or fabricated.
 */

import { listEvents, type EventListResult } from "@/lib/services/event-read.service";
import type { Event as UiEvent } from "@/types/event";

import { CalendarShell } from "./_components/calendar-shell";
import type { CalendarEventDto } from "./_components/calendar-event-dto";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const dynamic = "force-dynamic";

function toDto(event: UiEvent): CalendarEventDto {
  const dto: CalendarEventDto = {
    id: event.id,
    title: event.title,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    location: event.location,
    status: event.status,
    currentAttendees: event.currentAttendees,
  };
  if (event.maxAttendees !== undefined) dto.maxAttendees = event.maxAttendees;
  return dto;
}

export default async function EventsCalendarPage() {
  const now = new Date();

  const [upcomingResult, pastResult]: [EventListResult, EventListResult] = await Promise.all([
    listEvents({ startDate: now, sortBy: "startTime", sortOrder: "asc", limit: 100 }),
    listEvents({ endDate: now, sortBy: "startTime", sortOrder: "desc", limit: 100 }),
  ]);

  return (
    <CalendarShell
      upcomingEvents={upcomingResult.events.map(toDto)}
      pastEvents={pastResult.events.map(toDto)}
    />
  );
}
