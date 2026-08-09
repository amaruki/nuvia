/**
 * Serializable event shape passed from the calendar server page to the
 * client tabs. Dates travel as ISO strings; the client hydrates them.
 * Data comes from the real event service — no sample events, no fabricated
 * attendee counts.
 */
export interface CalendarEventDto {
  id: string;
  title: string;
  /** ISO timestamp of the event start. */
  startDate: string;
  /** ISO timestamp of the event end. */
  endDate: string;
  location: string;
  /** UI EventStatus value ("draft" | "published" | "cancelled" | "completed"). */
  status: string;
  /** Real registration count as stored by the event service. */
  currentAttendees: number;
  maxAttendees?: number;
}
