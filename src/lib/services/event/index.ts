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
  getEventCategories,
} from "./queries";
export { createEvent, updateEvent, deleteEvent, createEventCategory } from "./mutations";
export { registerForEvent, cancelEventRegistration, checkInToEvent } from "./registrations";
