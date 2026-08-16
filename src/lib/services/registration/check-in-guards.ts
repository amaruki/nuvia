/**
 * Shared event-state guards for check-in (issue #29).
 *
 * Before this helper existed, the two check-in paths enforced
 * contradictory rules: member self-check-in blocked CANCELED events and
 * enforced the schedule-derived window, while admin check-in examined the
 * event row only for existence. Staff could therefore record attendance on
 * a canceled or long-ended event, polluting analytics.
 *
 * Both paths now share these primitives. The window reuses the
 * self-check-in schedule rule (opens 1h before startTime, closes 1h after
 * endTime) so staff and members play by the same clock.
 *
 * The self-check-in path calls the two guards separately to keep its error
 * precedence (canceled -> attended -> confirmed -> QR code -> window); the
 * admin path uses the combined `assertEventAllowsCheckIn`.
 */

import { problems } from "@/lib/http";
import { formatDate, formatTime } from "@/lib/utils/event-utils";
import { getSelfCheckInWindow, getSelfCheckInWindowPhase } from "../event-self-check-in.service";
import { RegistrationServiceError } from "./errors";
import type { EventRow } from "./types";

/** Throws if the event is canceled — check-ins are unavailable. */
export function assertEventNotCanceled(eventRow: EventRow): void {
  if (eventRow.status === "CANCELED") {
    throw new RegistrationServiceError(
      problems.businessLogicError("This event has been canceled; check-in is unavailable."),
    );
  }
}

/**
 * Throws unless `now` is inside the schedule-derived check-in window
 * (startTime - 1h .. endTime + 1h).
 */
export function assertCheckInWindowOpen(eventRow: EventRow, now: Date = new Date()): void {
  const window = getSelfCheckInWindow(eventRow.startTime, eventRow.endTime);
  const phase = getSelfCheckInWindowPhase(window, now);
  if (phase === "upcoming") {
    throw new RegistrationServiceError(
      problems.businessLogicError(
        `Check-in has not opened yet. It opens ${formatDate(window.opensAt)} at ${formatTime(window.opensAt)}.`,
      ),
    );
  }
  if (phase === "ended") {
    throw new RegistrationServiceError(
      problems.businessLogicError(
        `Check-in has closed. It ended ${formatDate(window.closesAt)} at ${formatTime(window.closesAt)}.`,
      ),
    );
  }
}

/**
 * Throws unless the event currently admits check-ins: not canceled and
 * `now` is inside the schedule-derived window. Used by the admin path.
 */
export function assertEventAllowsCheckIn(eventRow: EventRow, now: Date = new Date()): void {
  assertEventNotCanceled(eventRow);
  assertCheckInWindowOpen(eventRow, now);
}
