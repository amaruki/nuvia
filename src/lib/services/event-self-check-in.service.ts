/**
 * Member self check-in (UI-24 item 5, roadmap D4).
 *
 * Lets a member with a CONFIRMED registration check themselves in using the
 * QR credential stored on their own registration (event_registrations.qr_code).
 * This complements — and never replaces — the staff check-in flow
 * (/events/[id]/check-in, gated by events:manage), which stays untouched.
 *
 * ## Window rule
 * The registration schema has no dedicated check-in-window columns
 * (event_registrations only stores registered_at / checked_in_at /
 * checked_out_at), so the window derives from the event's own schedule:
 * self check-in opens SELF_CHECK_IN_OPEN_MARGIN_MS before startTime and
 * closes SELF_CHECK_IN_CLOSE_MARGIN_MS after endTime (both 1 hour). The
 * server enforces the window on every POST regardless of what the page shows.
 *
 * ## Credential
 * Nothing else in the codebase writes qr_code, so registrations created
 * before this feature have NULL. The credential is minted lazily for the
 * owner the first time they open their self-check-in page, and the API only
 * ever compares it — it is never returned to anyone but the owner.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { event, eventRegistration } from "@/db/schema";
import { problem, problems } from "@/lib/http";
import { RegistrationServiceError } from "@/lib/services/registration/errors";
import { formatDate, formatTime, type DbRegistrationStatus } from "@/lib/utils/event-utils";

/** Check-in opens this long before the event starts. */
export const SELF_CHECK_IN_OPEN_MARGIN_MS = 60 * 60 * 1000;
/** Check-in closes this long after the event ends. */
export const SELF_CHECK_IN_CLOSE_MARGIN_MS = 60 * 60 * 1000;

export interface SelfCheckInWindow {
  opensAt: Date;
  closesAt: Date;
}

export function getSelfCheckInWindow(startTime: Date, endTime: Date): SelfCheckInWindow {
  return {
    opensAt: new Date(startTime.getTime() - SELF_CHECK_IN_OPEN_MARGIN_MS),
    closesAt: new Date(endTime.getTime() + SELF_CHECK_IN_CLOSE_MARGIN_MS),
  };
}

export type SelfCheckInWindowPhase = "upcoming" | "open" | "ended";

export function getSelfCheckInWindowPhase(
  window: SelfCheckInWindow,
  now: Date = new Date(),
): SelfCheckInWindowPhase {
  if (now < window.opensAt) return "upcoming";
  if (now > window.closesAt) return "ended";
  return "open";
}

/** Timing-safe credential comparison; hashing normalizes length differences. */
export function qrCredentialsMatch(provided: string, stored: string): boolean {
  const providedDigest = createHash("sha256").update(provided).digest();
  const storedDigest = createHash("sha256").update(stored).digest();
  return timingSafeEqual(providedDigest, storedDigest);
}

/**
 * Mints the QR credential for a registration that does not have one yet.
 * Serialized with SELECT … FOR UPDATE so two concurrent page loads mint the
 * same credential instead of racing.
 */
export async function mintSelfCheckInQrCode(registrationId: string): Promise<string> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: eventRegistration.id, qrCode: eventRegistration.qrCode })
      .from(eventRegistration)
      .where(eq(eventRegistration.id, registrationId))
      .for("update");
    if (!row) {
      throw new RegistrationServiceError(problems.notFound("Registration not found."));
    }
    if (row.qrCode) return row.qrCode;

    const code = randomBytes(24).toString("base64url");
    const [updated] = await tx
      .update(eventRegistration)
      .set({ qrCode: code })
      .where(eq(eventRegistration.id, registrationId))
      .returning({ qrCode: eventRegistration.qrCode });
    return updated.qrCode ?? code;
  });
}

export interface SelfCheckInEventSummary {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location: string | null;
  virtualEventUrl: string | null;
}

/** Everything the self-check-in page renders, discriminated by state. */
export type SelfCheckInView =
  | { status: "event-not-found" }
  | { status: "no-registration"; event: SelfCheckInEventSummary }
  | {
      status: "not-confirmed";
      event: SelfCheckInEventSummary;
      registrationStatus: DbRegistrationStatus;
    }
  | { status: "already-checked-in"; event: SelfCheckInEventSummary; checkedInAt: Date }
  | {
      status: "ready";
      event: SelfCheckInEventSummary;
      qrCode: string;
      window: SelfCheckInWindow;
      phase: SelfCheckInWindowPhase;
    };

/**
 * Loads the self-check-in state for the session user. `userId` always comes
 * from the server session, so the QR credential can only ever reach its
 * owner. Mints the credential lazily for CONFIRMED registrations.
 */
export async function getSelfCheckInView(
  eventId: string,
  userId: string,
  now: Date = new Date(),
): Promise<SelfCheckInView> {
  const [eventRow] = await db.select().from(event).where(eq(event.id, eventId)).limit(1);
  if (!eventRow) return { status: "event-not-found" };

  const summary: SelfCheckInEventSummary = {
    id: eventRow.id,
    title: eventRow.title,
    startTime: eventRow.startTime,
    endTime: eventRow.endTime,
    location: eventRow.location,
    virtualEventUrl: eventRow.virtualUrl,
  };

  const [registration] = await db
    .select()
    .from(eventRegistration)
    .where(and(eq(eventRegistration.eventId, eventId), eq(eventRegistration.userId, userId)))
    .limit(1);
  if (!registration) return { status: "no-registration", event: summary };
  if (registration.status === "ATTENDED") {
    return {
      status: "already-checked-in",
      event: summary,
      checkedInAt: registration.checkedInAt ?? registration.updatedAt,
    };
  }
  if (registration.status !== "CONFIRMED") {
    return { status: "not-confirmed", event: summary, registrationStatus: registration.status };
  }

  const qrCode = registration.qrCode ?? (await mintSelfCheckInQrCode(registration.id));
  const window = getSelfCheckInWindow(summary.startTime, summary.endTime);
  return {
    status: "ready",
    event: summary,
    qrCode,
    window,
    phase: getSelfCheckInWindowPhase(window, now),
  };
}

export interface SelfCheckInResult {
  registrationId: string;
  eventId: string;
  checkedInAt: Date;
}

/**
 * Records a self check-in. Every guard runs inside one transaction with the
 * registration and event rows locked, so concurrent POSTs cannot double-check
 * in and the window is always evaluated against committed data.
 */
export async function selfCheckIn(
  eventId: string,
  userId: string,
  providedCode: string,
  now: Date = new Date(),
): Promise<SelfCheckInResult> {
  return db.transaction(async (tx) => {
    const [registration] = await tx
      .select()
      .from(eventRegistration)
      .where(and(eq(eventRegistration.eventId, eventId), eq(eventRegistration.userId, userId)))
      .for("update");
    if (!registration) {
      throw new RegistrationServiceError(
        problems.notFound("You don't have a registration for this event."),
      );
    }

    const [eventRow] = await tx.select().from(event).where(eq(event.id, eventId)).for("update");
    if (!eventRow) {
      throw new RegistrationServiceError(problems.notFound("Event not found."));
    }

    if (eventRow.status === "CANCELED") {
      throw new RegistrationServiceError(
        problems.businessLogicError("This event has been canceled; check-in is unavailable."),
      );
    }
    if (registration.status === "ATTENDED") {
      throw new RegistrationServiceError(
        problems.conflict("You are already checked in to this event."),
      );
    }
    if (registration.status !== "CONFIRMED") {
      throw new RegistrationServiceError(
        problems.businessLogicError("Only confirmed registrations can check in."),
      );
    }
    if (!registration.qrCode || !qrCredentialsMatch(providedCode, registration.qrCode)) {
      throw new RegistrationServiceError(
        problem(
          "invalid-check-in-code",
          403,
          "Invalid check-in code",
          "The check-in code doesn't match this registration.",
        ),
      );
    }

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

    const [updated] = await tx
      .update(eventRegistration)
      .set({ status: "ATTENDED", checkedInAt: now })
      .where(eq(eventRegistration.id, registration.id))
      .returning({
        id: eventRegistration.id,
        eventId: eventRegistration.eventId,
        checkedInAt: eventRegistration.checkedInAt,
      });

    return {
      registrationId: updated.id,
      eventId: updated.eventId,
      checkedInAt: updated.checkedInAt ?? now,
    };
  });
}
