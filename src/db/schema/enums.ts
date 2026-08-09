/**
 * Postgres enum types.
 *
 * One-to-one translation of the enums that previously lived in
 * prisma/schema.prisma. Values are unchanged so existing rows and the
 * existing migration's CREATE TYPE statements remain valid — this file
 * describes the database, it does not redefine it.
 */

import { pgEnum } from "drizzle-orm/pg-core";

// Membership
export const membershipStatusEnum = pgEnum("MembershipStatus", [
  "ACTIVE",
  "TRIALING",
  "CANCELED",
  "PAST_DUE",
  "UNPAID",
  "PAUSED",
]);

export const transactionStatusEnum = pgEnum("TransactionStatus", [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

// Membership invoicing (backlog C3): an invoice is ISSUED until a payment
// settles it (PAID) or the treasurer voids it (VOID). PAID and VOID are
// terminal — there is no path back to ISSUED.
export const invoiceStatusEnum = pgEnum("InvoiceStatus", ["ISSUED", "PAID", "VOID"]);

// Membership join funnel (UI-33): applicants apply for a tier and staff review
// the application in the backoffice. Approval records the decision only — the
// membership itself is activated through the subscription backoffice.
export const membershipApplicationStatusEnum = pgEnum("MembershipApplicationStatus", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

// Events
export const eventTypeEnum = pgEnum("EventType", [
  "CONFERENCE",
  "MEETUP",
  "WORKSHOP",
  "WEBINAR",
  "NETWORKING",
  "SOCIAL",
  "TRAINING",
  "PANEL_DISCUSSION",
  "KEYNOTE",
  "OTHER",
]);

export const eventFormatEnum = pgEnum("EventFormat", [
  "IN_PERSON",
  "VIRTUAL",
  "HYBRID",
  "RECORDED",
  "LIVE_STREAM",
]);

export const eventStatusEnum = pgEnum("EventStatus", [
  "DRAFT",
  "PUBLISHED",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELED",
  "POSTPONED",
]);

export const eventVisibilityEnum = pgEnum("EventVisibility", [
  "PUBLIC",
  "MEMBERS_ONLY",
  "PREMIUM_MEMBERS",
  "SPECIFIC_ROLES",
  "PRIVATE",
  "INVITE_ONLY",
]);

export const registrationStatusEnum = pgEnum("RegistrationStatus", [
  "PENDING",
  "CONFIRMED",
  "WAITLISTED",
  "CANCELED",
  "ATTENDED",
  "NO_SHOW",
]);

export const sponsorTierEnum = pgEnum("SponsorTier", [
  "PLATINUM",
  "GOLD",
  "SILVER",
  "BRONZE",
  "PARTNER",
  "MEDIA",
]);

// Forum
export const postTypeEnum = pgEnum("PostType", [
  "DISCUSSION",
  "QUESTION",
  "ANNOUNCEMENT",
  "POLL",
  "RESOURCE",
  "JOB_POSTING",
  "EVENT_PROMOTION",
]);

export const postStatusEnum = pgEnum("PostStatus", [
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "ARCHIVED",
  "DELETED",
  "HIDDEN",
]);

export const commentStatusEnum = pgEnum("CommentStatus", [
  "PUBLISHED",
  "PENDING",
  "HIDDEN",
  "DELETED",
]);

export const reportTargetTypeEnum = pgEnum("ReportTargetType", ["POST", "COMMENT"]);

export const reportStatusEnum = pgEnum("ReportStatus", ["PENDING", "RESOLVED", "DISMISSED"]);

// Content
export const contentTypeEnum = pgEnum("ContentType", [
  "ARTICLE",
  "BLOG_POST",
  "PAGE",
  "NEWS",
  "TUTORIAL",
  "DOCUMENTATION",
  "RESOURCE",
  "PUBLICATION",
  "ANNOUNCEMENT",
]);

export const contentStatusEnum = pgEnum("ContentStatus", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
  "DELETED",
  "SCHEDULED",
]);

export const contentVisibilityEnum = pgEnum("ContentVisibility", [
  "PUBLIC",
  "MEMBERS_ONLY",
  "PREMIUM_MEMBERS",
  "SPECIFIC_ROLES",
  "PRIVATE",
]);

// Job board
export const jobStatusEnum = pgEnum("JobStatus", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
  "CLOSED",
  "FILLED",
  "CANCELLED",
]);

export const employmentTypeEnum = pgEnum("EmploymentType", [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "FREELANCE",
  "INTERNSHIP",
  "TEMPORARY",
  "VOLUNTEER",
]);

export const experienceLevelEnum = pgEnum("ExperienceLevel", [
  "ENTRY_LEVEL",
  "JUNIOR",
  "MID_LEVEL",
  "SENIOR",
  "LEAD",
  "EXECUTIVE",
  "NOT_SPECIFIED",
]);

export const applicationStatusEnum = pgEnum("ApplicationStatus", [
  "PENDING",
  "REVIEWING",
  "SHORTLISTED",
  "REJECTED",
  "INTERVIEWING",
  "OFFERED",
  "HIRED",
  "WITHDRAWN",
]);

// ---------------------------------------------------------------------------
// Chapters (backlog D1)
// ---------------------------------------------------------------------------

/**
 * ChapterStatus — chapter lifecycle. Stored SCREAMING_SNAKE; the UI works in
 * lowercase ("active" | "inactive" | "pending" | "suspended"), the service
 * maps across the boundary.
 */
export const chapterStatusEnum = pgEnum("ChapterStatus", [
  "ACTIVE",
  "INACTIVE",
  "PENDING",
  "SUSPENDED",
]);

/** ChapterRole — a member's leadership role within a chapter. */
export const chapterRoleEnum = pgEnum("ChapterRole", [
  "PRESIDENT",
  "VICE_PRESIDENT",
  "SECRETARY",
  "TREASURER",
  "ADMIN",
  "MEMBER",
]);
