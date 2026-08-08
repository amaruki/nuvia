/**
 * Awards — shared type contracts for award programs and nominations (backlog D4).
 *
 * These types are the single source of truth for the wire shape served by
 * /api/v1/awards/* (ISO date strings) mapped to UI Dates by the
 * src/lib/hooks/use-awards.ts hook, plus the filter/statistics contracts the
 * dashboard pages consume.
 */

export const AWARD_PROGRAM_STATUSES = ["draft", "open", "closed", "archived"] as const;
export type AwardProgramStatus = (typeof AWARD_PROGRAM_STATUSES)[number];

export const AWARD_CATEGORIES = [
  "achievement",
  "service",
  "leadership",
  "innovation",
  "scholarship",
  "lifetime_achievement",
] as const;
export type AwardCategory = (typeof AWARD_CATEGORIES)[number];

export const AWARD_NOMINATION_STATUSES = [
  "pending",
  "under_review",
  "approved",
  "rejected",
] as const;
export type AwardNominationStatus = (typeof AWARD_NOMINATION_STATUSES)[number];

export interface AwardProgram {
  id: string;
  /** Machine name; unique across programs (duplicate creates return 409). */
  name: string;
  description?: string;
  category: AwardCategory;
  status: AwardProgramStatus;
  /** Eligibility/selection criteria as free-text bullets. */
  criteria: string[];
  /** Nomination window open (inclusive). */
  openDate?: Date;
  /** Nomination deadline (inclusive). */
  closeDate?: Date;
  /** Date the award is conferred. */
  awardDate?: Date;
  /** Nominations submitted against this program. */
  nominationCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface AwardNomination {
  id: string;
  programId: string;
  /** Denormalized program name for tables; hydrated via join. */
  programName: string;
  /** Optional link to a member account when the nominee is one. */
  userId?: string;
  nomineeName: string;
  nomineeEmail: string;
  nominatorName: string;
  nominatorEmail: string;
  status: AwardNominationStatus;
  /** Supporting statement for the nomination. */
  statement?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface AwardProgramFilterOptions {
  status?: AwardProgramStatus[];
  category?: AwardCategory[];
  search?: string;
}

export interface AwardNominationFilterOptions {
  status?: AwardNominationStatus[];
  programId?: string;
  search?: string;
}

export interface AwardProgramOverallStatistics {
  totalPrograms: number;
  openPrograms: number;
  closedPrograms: number;
  draftPrograms: number;
  archivedPrograms: number;
  totalNominations: number;
  categoryBreakdown: { category: AwardCategory; count: number }[];
}

export interface AwardNominationOverallStatistics {
  totalNominations: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
}
