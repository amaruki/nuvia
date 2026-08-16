/**
 * Event lifecycle transition rules (issue #29, finding 5).
 *
 * Before this table existed, `updateEvent` accepted ANY status on every
 * PATCH, so an admin could resurrect a COMPLETED event back to PUBLISHED
 * (reopening registration on an event that already happened) or flip a
 * CANCELED event back to REGISTRATION_OPEN. There is no scheduler that
 * moves event statuses automatically — the table below is the only
 * authority on which manual transitions are legal.
 *
 * COMPLETED and CANCELED are terminal; POSTPONED events return to DRAFT
 * (needs new dates) or PUBLISHED (dates already fixed).
 */

import type { eventStatusEnum } from "@/db/schema/enums";

export type DbEventStatus = (typeof eventStatusEnum.enumValues)[number];

/**
 * Legal status transitions for events. A PATCH that sets a status not
 * listed for the event's current status is rejected with 409. Setting the
 * current status again is a no-op and always allowed (forms resend the
 * full payload on every save).
 */
export const EVENT_STATUS_TRANSITIONS: Record<DbEventStatus, readonly DbEventStatus[]> = {
  DRAFT: ["PUBLISHED", "CANCELED"],
  PUBLISHED: [
    "REGISTRATION_OPEN",
    "REGISTRATION_CLOSED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELED",
    "POSTPONED",
  ],
  REGISTRATION_OPEN: ["REGISTRATION_CLOSED", "IN_PROGRESS", "COMPLETED", "CANCELED", "POSTPONED"],
  REGISTRATION_CLOSED: ["REGISTRATION_OPEN", "IN_PROGRESS", "COMPLETED", "CANCELED", "POSTPONED"],
  IN_PROGRESS: ["COMPLETED", "CANCELED", "POSTPONED"],
  POSTPONED: ["DRAFT", "PUBLISHED"],
  COMPLETED: [],
  CANCELED: [],
};

/** Statuses with no outgoing transitions. */
export const TERMINAL_EVENT_STATUSES: readonly DbEventStatus[] = ["COMPLETED", "CANCELED"];
