/**
 * Server-side event write operations (backlog B3) — create/update/delete
 * against the events tables. Consumed by the POST /api/v1/events and
 * PATCH/DELETE /api/v1/events/[id] route handlers.
 *
 * Split from src/lib/services/event-write.service.ts. Named event-write/ so
 * it sits beside the read-side folder src/lib/services/event/ without a
 * collision — the B2 read path stays in event-read.service.ts and the
 * registration lifecycle in registration.service.ts.
 *
 * This module imports the database client, so it must never be imported
 * from client components (same rule as event-read.service.ts).
 *
 * Throws {@link EventWriteError} carrying an RFC 9457 ProblemDetails
 * payload; route handlers map it through `problemResponse`.
 */

export { EventWriteError } from "./errors";
export type {
  DbEventFormat,
  DbEventStatus,
  DbEventType,
  DbEventVisibility,
  EventDto,
} from "./types";
export { toEventDto } from "./mappers";
export { createEventSchema, updateEventSchema } from "./schemas";
export type { CreateEventInput, UpdateEventInput } from "./schemas";
export { createEvent, deleteEvent, updateEvent } from "./mutations";
