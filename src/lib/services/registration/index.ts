/**
 * Server-side registration lifecycle (backlog B3) — register, cancel,
 * check-in, and the admin registration list for one event. Consumed by the
 * /api/v1/events/[id]/registrations route handlers. Split from
 * src/lib/services/registration.service.ts, which stays as a re-export shim
 * so `@/lib/services/registration.service` keeps resolving.
 *
 * This module imports the database client, so it must never be imported
 * from client components.
 *
 * Seat accounting: `event.registeredCount` counts registrations that hold a
 * seat (PENDING/CONFIRMED/ATTENDED); `event.waitlistCount` counts
 * WAITLISTED rows. Canceling a seat-holding registration promotes the
 * oldest WAITLISTED row when one exists. CANCELED rows are re-used on
 * re-registration so the (user_id, event_id) pair keeps a single row.
 */

export { RegistrationServiceError } from "./errors";
export { createRegistrationSchema, listRegistrationsQuerySchema } from "./schemas";
export type { CreateRegistrationInput, ListRegistrationsQuery } from "./schemas";
export type {
  CancelRegistrationActor,
  DbRegistrationStatus,
  RegistrationDto,
  RegistrationListResult,
  RegistrationUserDto,
} from "./types";
export {
  createRegistration,
  cancelRegistration,
  checkInRegistration,
  approveRegistration,
} from "./mutations";
export { listRegistrations } from "./queries";
