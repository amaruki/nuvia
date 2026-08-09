// Event enums for Nuvia community platform

export enum EventStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

export enum EventType {
  WORKSHOP = "workshop",
  MEETUP = "meetup",
  CONFERENCE = "conference",
  WEBINAR = "webinar",
  SOCIAL = "social",
  TRAINING = "training",
  OTHER = "other",
}

export enum RegistrationStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  WAITLISTED = "waitlisted",
}

/**
 * Registration window as surfaced in the public UI (UI-24).
 *
 * The DB event lifecycle (REGISTRATION_OPEN / REGISTRATION_CLOSED /
 * IN_PROGRESS …) is intentionally collapsed into the four UI EventStatus
 * buckets for admin list compatibility, so public CTAs read this derived
 * window state instead to know whether registration is actually open.
 */
export type EventRegistrationWindow = "open" | "closed" | "live";
