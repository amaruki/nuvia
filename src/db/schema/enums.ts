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

// Content
export const contentTypeEnum = pgEnum("ContentType", [
  "ARTICLE",
  "BLOG_POST",
  "PAGE",
  "NEWS",
  "TUTORIAL",
  "DOCUMENTATION",
  "RESOURCE",
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
