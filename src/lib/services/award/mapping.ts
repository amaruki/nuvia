import type { AwardCategory, AwardNominationStatus, AwardProgramStatus } from "@/types/award.types";

// ---------------------------------------------------------------------------
// Status/category mapping (DB enums are SCREAMING_SNAKE, UI is lowercase)
// ---------------------------------------------------------------------------

export type DbAwardProgramStatus = "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
export type DbAwardCategory =
  | "ACHIEVEMENT"
  | "SERVICE"
  | "LEADERSHIP"
  | "INNOVATION"
  | "SCHOLARSHIP"
  | "LIFETIME_ACHIEVEMENT";
export type DbAwardNominationStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export const UI_TO_DB_PROGRAM_STATUS: Record<AwardProgramStatus, DbAwardProgramStatus> = {
  draft: "DRAFT",
  open: "OPEN",
  closed: "CLOSED",
  archived: "ARCHIVED",
};

export const DB_TO_UI_PROGRAM_STATUS: Record<DbAwardProgramStatus, AwardProgramStatus> = {
  DRAFT: "draft",
  OPEN: "open",
  CLOSED: "closed",
  ARCHIVED: "archived",
};

export const UI_TO_DB_CATEGORY: Record<AwardCategory, DbAwardCategory> = {
  achievement: "ACHIEVEMENT",
  service: "SERVICE",
  leadership: "LEADERSHIP",
  innovation: "INNOVATION",
  scholarship: "SCHOLARSHIP",
  lifetime_achievement: "LIFETIME_ACHIEVEMENT",
};

export const DB_TO_UI_CATEGORY: Record<DbAwardCategory, AwardCategory> = {
  ACHIEVEMENT: "achievement",
  SERVICE: "service",
  LEADERSHIP: "leadership",
  INNOVATION: "innovation",
  SCHOLARSHIP: "scholarship",
  LIFETIME_ACHIEVEMENT: "lifetime_achievement",
};

export const UI_TO_DB_NOMINATION_STATUS: Record<AwardNominationStatus, DbAwardNominationStatus> = {
  pending: "PENDING",
  under_review: "UNDER_REVIEW",
  approved: "APPROVED",
  rejected: "REJECTED",
};

export const DB_TO_UI_NOMINATION_STATUS: Record<DbAwardNominationStatus, AwardNominationStatus> = {
  PENDING: "pending",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
};
