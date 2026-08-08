import type { AnnouncementPriority, AnnouncementTargetAudience, AnnouncementType } from "./base";

// Type constants for re-use
export const ANNOUNCEMENT_TYPES: AnnouncementType[] = [
  "general",
  "event",
  "policy",
  "maintenance",
  "feature",
  "security",
  "reminder",
  "celebration",
  "emergency",
  "banner",
] as const;

export const ANNOUNCEMENT_PRIORITIES: AnnouncementPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;

export const ANNOUNCEMENT_TARGET_AUDIENCES: AnnouncementTargetAudience[] = [
  "all_members",
  "specific_chapters",
  "specific_committees",
  "premium_members",
  "chapter_admins",
  "committee_chairs",
  "staff_only",
  "public",
] as const;
