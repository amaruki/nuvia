/**
 * Event service for handling event-related API operations
 */

export {
  getEvents,
  getEventById,
  getEventStatistics,
  getEventDashboardData,
  getUserEventRegistrations,
  getUserOrganizedEvents,
} from "./queries";
export { createEvent, updateEvent, deleteEvent } from "./mutations";
export { registerForEvent, cancelEventRegistration, checkInToEvent } from "./registrations";
export { getEventCertificate, verifyEventCertificate } from "./certificates";
