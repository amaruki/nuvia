/**
 * Registration lifecycle graph (issue #17).
 *
 * Documents, in one place, every status transition the registration
 * mutations enforce. The status-graph regression test asserts that no enum
 * value is a dead end here: every status must be reachable (some mutation
 * writes it) and escapable (some mutation moves out of it) unless it is an
 * explicitly declared terminal outcome.
 *
 *   create ─────► PENDING (approval-gated) | CONFIRMED | WAITLISTED (full)
 *   approve ────► CONFIRMED        from PENDING
 *   check-in ───► ATTENDED         from CONFIRMED
 *   no-show ────► NO_SHOW          from CONFIRMED (issue #17; releases the
 *                                  seat and promotes the waitlist, like cancel)
 *   cancel ─────► CANCELED         from PENDING | CONFIRMED | WAITLISTED
 *   promote ────► PENDING | CONFIRMED from WAITLISTED (cancel/no-show paths)
 *   re-register ► PENDING | CONFIRMED | WAITLISTED from CANCELED (the row is
 *                                  reused, keeping one row per user+event)
 *
 * ATTENDED and NO_SHOW are recorded outcomes: nothing moves out of them.
 */

import type { DbRegistrationStatus } from "./types";

export const REGISTRATION_TRANSITIONS: Record<
  DbRegistrationStatus,
  readonly DbRegistrationStatus[]
> = {
  PENDING: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["ATTENDED", "NO_SHOW", "CANCELED"],
  WAITLISTED: ["PENDING", "CONFIRMED", "CANCELED"],
  CANCELED: ["PENDING", "CONFIRMED", "WAITLISTED"],
  ATTENDED: [],
  NO_SHOW: [],
};

/** Statuses that intentionally have no exit (recorded event outcomes). */
export const TERMINAL_REGISTRATION_STATUSES: readonly DbRegistrationStatus[] = [
  "ATTENDED",
  "NO_SHOW",
];
