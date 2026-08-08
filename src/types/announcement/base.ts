// Announcement-specific types

export type AnnouncementPriority = "low" | "medium" | "high" | "urgent";

export type AnnouncementTargetAudience =
  | "all_members"
  | "specific_chapters"
  | "specific_committees"
  | "premium_members"
  | "chapter_admins"
  | "committee_chairs"
  | "staff_only"
  | "public";

export type AnnouncementType =
  | "general"
  | "event"
  | "policy"
  | "maintenance"
  | "feature"
  | "security"
  | "reminder"
  | "celebration"
  | "emergency"
  | "banner";
