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
